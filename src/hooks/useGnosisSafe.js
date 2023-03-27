import { useCallback, useRef, useMemo } from 'react'
import { useToasts } from 'hooks/toasts'

import { Methods } from '@gnosis.pm/safe-apps-sdk'
import { GnosisConnector } from 'lib/GnosisConnector'
import { getProvider } from 'ambire-common/src/services/provider'

import { rpcProviders } from 'config/providers'

const STORAGE_KEY = 'gnosis_safe_state'

export default function useGnosisSafe({
  selectedAccount,
  network,
  verbose = 0,
  useStorage,
  setRequests
}) {
  // One connector at a time
  const connector = useRef(null)

  const uniqueId = useMemo(
    () => `${new Date().getTime()} ${network.chainId} ${selectedAccount}`,
    [selectedAccount, network]
  )

  const { addToast } = useToasts()

  // This is needed cause of the Gnosis Safe event handlers (listeners)
  const stateRef = useRef()
  stateRef.current = {
    selectedAccount,
    network
  }

  const [stateStorage, setStateStorage] = useStorage({
    key: STORAGE_KEY,
    defaultValue: [],
    setInit: (initialRequests) => (!Array.isArray(initialRequests) ? [] : initialRequests)
  })

  const connect = useCallback(
    (connectorOpts) => {
      if (verbose > 0) {
        console.log('GS: creating connector')
      }

      try {
        connector.current = new GnosisConnector(
          connectorOpts.iframeRef,
          connectorOpts.app,
          uniqueId
        )
      } catch (e) {
        addToast(`Unable to connect to ${connectorOpts.app.url}: ${e.message}`)
        return null
      }

      // reply back to iframe with safe data
      connector.current.on(Methods.getSafeInfo, () => {
        return {
          safeAddress: stateRef.current.selectedAccount,
          network: stateRef.current.network.id,
          chainId: stateRef.current.network.chainId,
          owners: [stateRef.current.selectedAccount],
          threshold: 1 // Number of confirmations (not used in ambire)
        }
      })

      // reply back to iframe with safe data

      // connector.current.on(Methods.getSafeBalances, async (msg) => {
      //   verbose>0 && console.log("DApp requested getSafeBalances") && console.log(msg)

      // TODO later
      // await portfolio.updatePortfolio("polygon", selectedAccount, true)//not this because it does NOT return the updated state anyway
      // console.log(portfolio)

      // struct template
      /* connector.current.on(Methods.getSafeBalances, () => {
      return {
        "fiatTotal": "0.18072",
          "items": [
          {
            "tokenInfo": {
              "type": "NATIVE_TOKEN",
              "address": "0x0000000000000000000000000000000000000000",
              "decimals": 18,
              "symbol": "MATIC",
              "name": "Matic",
              "logoUri": "https://safe-transaction-assets.staging.gnosisdev.com/chains/137/currency_logo.png"
            },
            "balance": "100000000000000000",
            "fiatBalance": "0.18072",
            "fiatConversion": "1.8072"
          }
        ]
      }
     }) */

      connector.current.on(Methods.rpcCall, async (msg) => {
        verbose > 0 && console.log('DApp requested rpcCall', msg)

        if (!msg?.data?.params) {
          throw new Error('invalid call object')
        }
        const method = msg.data.params.call
        const callTx = msg.data.params.params

        // NOTE: swap only provider
        const provider =
          connector?.current?.app?.name === 'Ambire swap'
            ? rpcProviders[`${stateRef.current.network.id}-ambire-swap`] ||
              getProvider(stateRef.current.network.id)
            : getProvider(stateRef.current.network.id)
        // const provider = getProvider(stateRef.current.network.id)

        let result
        if (method === 'eth_call') {
          result = await provider.call(callTx[0], callTx[1]).catch((err) => {
            throw err
          })
        } else if (method === 'eth_getBalance') {
          result = await provider.getBalance(callTx[0], callTx[1]).catch((err) => {
            throw err
          })
        } else if (method === 'eth_blockNumber') {
          result = await provider.getBlockNumber().catch((err) => {
            throw err
          })
        } else if (method === 'eth_getBlockByNumber' || method === 'eth_getBlockByHash') {
          if (callTx[1]) {
            result = await provider.getBlockWithTransactions(callTx[0]).catch((err) => {
              throw err
            })
          } else {
            result = await provider.getBlock(callTx[0]).catch((err) => {
              throw err
            })
          }
        } else if (method === 'eth_getTransactionByHash') {
          result = await provider.getTransaction(callTx[0]).catch((err) => {
            throw err
          })
        } else if (method === 'eth_getCode') {
          result = await provider.getCode(callTx[0], callTx[1]).catch((err) => {
            throw err
          })
        } else if (method === 'eth_getBlockByNumber') {
          result = await provider.getBlock(callTx[0], callTx[1]).catch((err) => {
            throw err
          })
        } else if (method === 'eth_getTransactionReceipt') {
          result = await provider.getTransactionReceipt(callTx[0]).catch((err) => {
            throw err
          })
          // requires custom from calls from SDK but are not implemented in gnosis SDK
        } else if (method === 'gs_multi_send' || method === 'ambire_sendBatchTransaction') {
          // As future proof as possible (tested with a tweaked eth_call)
          msg.data.params.txs = callTx[0]
          await handleSendTransactions(msg).catch((err) => {
            throw err
          })
        } else if (method === 'personal_sign') {
          result = await handlePersonalSign(msg).catch((err) => {
            throw err
          })
        } else if (method === 'eth_estimateGas') {
          result = await provider.estimateGas(callTx).catch((err) => {
            throw err
          })
        } else {
          throw new Error(`Method not found: ${method}`)
        }
        return result
      })

      connector.current.on(Methods.sendTransactions, (msg) => {
        handleSendTransactions(msg)
      })

      const handleSendTransactions = (msg) => {
        verbose > 0 && console.log('DApp requested sendTx', msg)

        const data = msg?.data
        if (!data) {
          console.error('GS: no data')
          return
        }

        const txs = data?.params?.txs
        if (txs?.length) {
          for (const i in txs) {
            if (!txs[i].from) txs[i].from = stateRef.current.selectedAccount
          }
        } else {
          console.error('GS: no txs in received payload')
          return
        }

        for (const ix in txs) {
          const id = `gs_${data.id}:${ix}`
          const request = {
            id,
            dateAdded: new Date().valueOf(),
            forwardId: msg.data.id,
            type: 'eth_sendTransaction',
            isBatch: txs.length > 1,
            txn: txs[ix], // if anyone finds a dapp that sends a bundle, please reach me out
            chainId: stateRef.current.network.chainId,
            account: stateRef.current.selectedAccount
          }
          // is reducer really needed here?
          setStateStorage((prevRequests) =>
            prevRequests.find((x) => x.id === request.id)
              ? prevRequests
              : [...prevRequests, request]
          )
          setRequests((prevRequests) =>
            prevRequests.find((x) => x.id === request.id)
              ? prevRequests
              : [...prevRequests, request]
          )
        }
      }

      const handlePersonalSign = (msg) => {
        verbose > 0 && console.log('DApp requested signMessage', msg)

        const data = msg?.data
        if (!data) {
          console.error('GS: no data')
          return
        }

        const id = `gs_${data.id}`
        const message = data?.params?.message
        if (!message) {
          console.error('GS: no message in received payload')
          return
        }

        const currentAppData = connector.current.app

        const request = {
          id,
          dateAdded: new Date().valueOf(),
          forwardId: msg.data.id,
          type:
            message.signType === 'eth_signTypedData_v4' ? 'eth_signTypedData_v4' : 'personal_sign',
          txn: message.signType === 'eth_signTypedData_v4' ? JSON.parse(message.message) : message,
          chainId: stateRef.current.network.chainId,
          account: stateRef.current.selectedAccount,
          dapp: currentAppData
            ? {
                name: currentAppData.name,
                description: currentAppData.description,
                icons: [currentAppData.iconUrl],
                url: currentAppData.url
              }
            : null
        }

        setStateStorage((prevRequests) =>
          prevRequests.find((x) => x.id === request.id) ? prevRequests : [...prevRequests, request]
        )
        setRequests((prevRequests) =>
          prevRequests.find((x) => x.id === request.id) ? prevRequests : [...prevRequests, request]
        )
      }

      connector.current.on(Methods.signMessage, (msg) => handlePersonalSign(msg))

      connector.current.on(Methods.getTxBySafeTxHash, async (msg) => {
        const { safeTxHash } = msg.data.params
        const provider = getProvider(stateRef.current.network.id)
        try {
          const res = await provider.getTransaction(safeTxHash)

          return res
        } catch (e) {
          console.error(`GS: Err getting transaction ${safeTxHash}`)
          console.log(e)
          return {}
        }
      })
    },
    [uniqueId, addToast, verbose, setStateStorage, setRequests]
  )

  const disconnect = useCallback(() => {
    verbose > 1 && console.log('GS: disconnecting connector')
    connector.current?.clear()
  }, [verbose])

  const resolveMany = (ids, resolution) => {
    for (const req of stateStorage.filter((x) => ids.includes(x.id))) {
      if (!req.isBatch || req.id.endsWith(':0')) {
        const replyData = {
          id: req.forwardId,
          dateAdded: new Date().valueOf(),
          success: null,
          txId: null,
          error: null
        }
        if (!resolution) {
          replyData.error = 'Nothing to resolve'
          replyData.success = false
        } else if (!resolution.success) {
          replyData.error = resolution.message
          replyData.success = false
        } else {
          // onSuccess
          replyData.success = true
          replyData.txId = resolution.result
          replyData.safeTxHash = resolution.result
        }
        if (!connector.current) {
          // soft error handling: sendTransaction has issues
          // throw new Error("gnosis safe connector not set")
          console.error('gnosis safe connector not set')
        } else {
          console.log('gnosis reply', replyData)
          if (replyData?.error) {
            addToast(replyData.error, { error: true })
          }
          connector.current.send(replyData, req.forwardId, replyData.error)
        }
      }
    }

    setStateStorage((prevRequests) => prevRequests.filter((x) => !ids.includes(x.id)))
    setRequests((prevRequests) => prevRequests.filter((x) => !ids.includes(x.id)))
  }

  return {
    requests: stateStorage,
    resolveMany,
    connect,
    disconnect
  }
}
