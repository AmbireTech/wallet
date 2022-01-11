import {useCallback, useEffect, useState, useRef, useMemo} from 'react'
import {useToasts} from 'hooks/toasts'

import {Methods} from '@gnosis.pm/safe-apps-sdk'
import {GnosisConnector} from 'lib/GnosisConnector'
import { getProvider } from 'lib/provider'

const STORAGE_KEY = 'gnosis_safe_state'

export default function useGnosisSafe({selectedAccount, network, verbose = 0}) {
  // One connector at a time
  const connector = useRef(null)

  const uniqueId = useMemo(() => new Date().getTime() + ' ' + network.chainId + ' ' + selectedAccount, [selectedAccount, network])

  const {addToast} = useToasts()

  // This is needed cause of the Gnosis Safe event handlers (listeners)
  const stateRef = useRef()
  stateRef.current = {
    selectedAccount,
    network
  }

  const [requests, setRequests] = useState(() => {
    const json = localStorage[STORAGE_KEY]
    if (!json) return []
    try {
      const parsed = JSON.parse(json)
      return Array.isArray(parsed) ? parsed : []
    } catch (e) {
      console.error(e)
      return []
    }
  })

  const connect = useCallback(connectorOpts => {
    verbose > 1 && console.log("GS: creating connector")

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
        threshold: 1, //Number of confirmations (not used in ambire)
      }
    })

    //reply back to iframe with safe data

    // connector.current.on(Methods.getSafeBalances, async (msg) => {
    //   verbose>0 && console.log("DApp requested getSafeBalances") && console.log(msg)

    //TODO later
    //await portfolio.updatePortfolio("polygon", selectedAccount, true)//not this because it does NOT return the updated state anyway
    //console.log(portfolio)

    //struct template
    /*connector.current.on(Methods.getSafeBalances, () => {
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
     })*/

    connector.current.on(Methods.rpcCall, async (msg) => {
      verbose > 0 && console.log("DApp requested rpcCall", msg)

      if (!msg?.data?.params) {
        throw new Error("invalid call object")
      }
      const method = msg.data.params.call//0 == tx, 1 == blockNum
      const callTx = msg.data.params.params//0 == tx, 1 == blockNum

      const provider = getProvider(stateRef.current.network.id)
      let result
      if (method === "eth_call") {
        result = await provider.call(callTx[0], callTx[1]).catch(err => {
          throw err
        })
      } else if (method === "eth_getBalance") {
        result = await provider.getBalance(callTx[0], callTx[1]).catch(err => {
          throw err
        })
      } else if (method === "eth_blockNumber") {
        result = await provider.getBlockNumber().catch(err => {
          throw err
        })
      } else if (method === "eth_getBlockByNumber" || method === "eth_getBlockByHash") {
        if (callTx[1]) {
          result = await provider.getBlockWithTransactions(callTx[0]).catch(err => {
            throw err
          })
        } else {
          result = await provider.getBlock(callTx[0]).catch(err => {
            throw err
          })
        }
      } else if (method === "eth_getTransactionByHash") {
        result = await provider.getTransaction(callTx[0]).catch(err => {
          throw err
        })
      } else if (method === "eth_getCode") {
        result = await provider.getCode(callTx[0], callTx[1]).catch(err => {
          throw err
        })
      } else if (method === "eth_getBlockByNumber") {
        result = await provider.getBlock(callTx[0], callTx[1]).catch(err => {
          throw err
        })
      } else if (method === "eth_getTransactionReceipt") {
        result = await provider.getTransactionReceipt(callTx[0]).catch(err => {
          throw err
        })
      } else if (method === "personal_sign") {
        result = await handlePersonalSign(msg).catch(err => {
          throw err
        })
      } else {
        throw new Error("method not supported " + method)
      }
      return result
    })

    connector.current.on(Methods.sendTransactions, (msg) => {
      verbose > 0 && console.log("DApp requested sendTx") && console.log(msg)

      const data = msg?.data
      if (!data) {
        console.error('GS: no data')
        return
      }

      const id = 'gs_' + data.id
      const txs = data?.params?.txs
      if (txs?.length) {
        for (let i in txs) {
          if (!txs[i].from) txs[i].from = stateRef.current.selectedAccount
        }
      } else {
        console.error('GS: no txs in received payload')
        return
      }

      const request = {
        id,
        forwardId: msg.data.id,
        type: 'eth_sendTransaction',
        txn: txs[0], //if anyone finds a dapp that sends a bundle, please reach me out
        chainId: stateRef.current.network.chainId,
        account: stateRef.current.selectedAccount
      }

      setRequests(prevRequests => prevRequests.find(x => x.id === request.id) ? prevRequests : [...prevRequests, request])
    })

    const handlePersonalSign = (msg) => {
      verbose > 0 && console.log("DApp requested signMessage") && console.log(msg)

      console.log(msg);

      const data = msg?.data
      if (!data) {
        console.error('GS: no data')
        return
      }

      const id = 'gs_' + data.id
      const message = data?.params?.message
      if (!message) {
        console.error('GS: no message in received payload')
        return
      }

      const request = {
        id,
        forwardId: msg.data.id,
        type: 'personal_sign',
        txn: message,
        chainId: stateRef.current.network.chainId,
        account: stateRef.current.selectedAccount
      }

      setRequests(prevRequests => prevRequests.find(x => x.id === request.id) ? prevRequests : [...prevRequests, request])
    }

    connector.current.on(Methods.signMessage, (msg) => {
        return handlePersonalSign(msg)
    })

    connector.current.on(Methods.getTxBySafeTxHash, async (msg) => {
      const {safeTxHash} = msg.data.params
      const provider = getProvider(stateRef.current.network.id)
      try {
        const res = await provider.getTransaction(safeTxHash)

        return res
      } catch (e) {
        console.error("GS: Err getting transaction " + safeTxHash)
        console.log(e)
        return {}
      }
    })
  }, [uniqueId, addToast, verbose])


  const disconnect = useCallback(() => {
    verbose > 1 && console.log("GS: disconnecting connector")
    connector.current?.clear()
  }, [verbose])

  const resolveMany = (ids, resolution) => {
    for (let req of requests.filter(x => ids.includes(x.id))) {
      const replyData = {
        id: req.forwardId,
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
      } else { //onSuccess
        replyData.success = true
        replyData.txId = resolution.result
        replyData.safeTxHash = resolution.result
      }
      if (!connector.current) {
        //soft error handling: sendTransaction has issues
        //throw new Error("gnosis safe connector not set")
        console.error('gnosis safe connector not set')
      } else {
        connector.current.send(replyData, req.forwardId, replyData.error)
      }
    }

    setRequests(prevRequests => prevRequests.filter(x => !ids.includes(x.id)))
  }

  // Side effects that will run on every state change/rerender
  useEffect(() => {
    localStorage[STORAGE_KEY] = JSON.stringify(requests)
  }, [requests, selectedAccount, network])

  return {
    requests,
    resolveMany,
    connect,
    disconnect
  }
}
