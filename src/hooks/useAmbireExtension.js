import { useCallback, useEffect, useState, useRef } from 'react'
import { getDefaultProvider, BigNumber } from 'ethers'
import { getTransactionSummary } from 'lib/humanReadableTransactions'
import { useToasts } from './toasts'

import {
  setupAmbexMessenger,
  sendMessage,
  addMessageHandler,
  removeMessageHandler,
  clear,
  sendReply,
} from 'lib/ambexMessenger'
import { fetchGet } from 'lib/fetch'
import networks from 'consts/networks'
import { hexlify } from 'ethers/lib/utils'

const STORAGE_KEY = 'ambire_extension_state'

export default function useAmbireExtension({
                                             allNetworks,
                                             accounts,
                                             setNetwork,
                                             selectedAccount,
                                             network,
                                             portfolio,
                                             rewardsData,
                                             relayerURL,
                                             onSelectAcc,
                                             verbose = 1
                                           }) {

  const stateRef = useRef()
  stateRef.current = {
    selectedAccount,
    network
  }

  const { addToast } = useToasts()

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


  const [ambexSetupRefresh, setAmbexSetupRefresh] = useState(null)

  const sanitize2hex = useCallback((any) => {
    if (verbose > 2) console.warn(`instanceof of any is ${any instanceof BigNumber}`)
    if (any instanceof BigNumber) {
      return any.toHexString()
    } else {
      if (any === undefined || any === null) {
        return any
      }
      return BigNumber.from(any).toHexString()
    }
  }, [verbose])

  // eth_sign, personal_sign
  const handlePersonalSign = useCallback(async (message) => {
    const payload = message.data
    verbose > 0 && console.log('AmbEx requested signMessage', payload)

    if (!payload) {
      console.error('AmbExHook: no payload', message)
      return
    }

    const id = 'ambex_' + payload.id
    let messageToSign = payload?.params?.message || payload?.params[0]
    if (payload.method === 'eth_sign') {
      messageToSign = payload?.params[1]
    }
    if (!messageToSign) {
      console.error('AmbExHook: no message in received payload')
      return
    }

    const request = {
      id,
      originalPayloadId: payload.id,//id for internal ambire requests purposes, originalPayloadId, to return
      type: payload.method,
      txn: messageToSign,
      chainId: stateRef.current.network.chainId,
      account: stateRef.current.selectedAccount,
      originalMessage: message
    }

    verbose > 0 && console.log('sending personal sign to queue', request)

    setRequests(prevRequests => prevRequests.find(x => x.id === request.id) ? prevRequests : [...prevRequests, request])
  }, [verbose])

  const resolveMany = (ids, resolution) => {
    for (let req of requests.filter(x => ids.includes(x.id))) {

      //only process non batch or first batch req
      if (!req.isBatch || req.id.endsWith(':0')) {

        let rpcResult = {
          jsonrpc: '2.0',
          id: req.originalPayloadId,
          txId: null,
          hash: null,
          result: null,
          success: null,
          error: null
        }

        if (!resolution) {
          rpcResult.error = { message: 'Nothing to resolve' }
          rpcResult.success = false
        } else if (!resolution.success) {
          rpcResult.error = { message: resolution.message }
          rpcResult.success = false
        } else { //onSuccess
          rpcResult.success = true
          rpcResult.txId = resolution.result
          rpcResult.hash = resolution.result
          rpcResult.result = resolution.result
        }

        sendReply(req.originalMessage, {
          data: rpcResult
        })
      }
    }
    setRequests(prevRequests => prevRequests.filter(x => !ids.includes(x.id)))
  }

  // Side effects that will run on every state change/rerender
  useEffect(() => {
    localStorage[STORAGE_KEY] = JSON.stringify(requests)
  }, [requests])

  //rerun on acc / chain changed
  useEffect(() => {

    //setting up messaging protocol. This page is a pageContext (ambirePageContext)
    setupAmbexMessenger('ambirePageContext')

    sendMessage({
      to: 'background',
      type: 'ambireWalletAccountChanged',
      data: {
        account: selectedAccount
      }
    }, {ignoreReply: true})

    sendMessage({
      to: 'background',
      type: 'ambireWalletChainChanged',
      data: {
        chainId: network.chainId
      }
    }, {ignoreReply: true})

    verbose > 2 && console.log('listening to msgs')

    //Not relevant for ambex but useful for debug purposes. Leave it?
    addMessageHandler({ type: 'ping' }, (message) => {
      sendReply(message, {
        data: selectedAccount + ' Ambex PONG!!!'
      })
    })

    // Post-focus, display a message to the user to make him understand why he switched tabs automatically
    addMessageHandler({ type: 'displayUserInterventionNotification' }, (message) => {
      setTimeout(() => addToast('An user interaction has been requested'), 500)
    })

    //contentScript triggers this, then this(ambirePageContext) should inform proper injection to background
    addMessageHandler({ type: 'ambireContentScriptInjected' }, (message) => {
      sendMessage({
        to: 'background',
        type: 'ambirePageContextInjected',
        data: {
          account: selectedAccount,
          chainId: network.chainId
        }
      }, {ignoreReply: true})
    })

    //Used on extension lifecycle reloading to check if previous ambire injected tabs are still up
    addMessageHandler({ type: 'keepalive' }, (message) => {
      sendReply(message, {
        type: 'keepalive_reply',//only case where reply with type required (for now)
        data: {
          account: selectedAccount,
          chainId: network.chainId
        }
      })
    })

    addMessageHandler({ type: 'extension_getCoreAccountData' }, (message) => {
      sendReply(message, {
        data: {
          account: selectedAccount,
          chainId: network.chainId
        }
      })
    })

    addMessageHandler({ type: 'extension_getBundles' }, async (message) => {
      //TODO should refactor in a hook?
      const url = relayerURL
        ? `${relayerURL}/identity/${selectedAccount}/${network.id}/transactions`
        : null

      const data = await fetchGet(url).catch(err => {})

      if (data) {
        const executedTransactions = data ? data.txns.filter(x => x.executed) : []
        const bundlesList = executedTransactions.map(bundle => {
          const network = networks.find(x => x.id === bundle.network)
          const summaries = bundle.txns.slice(0, -1).map(tx => {
            return getTransactionSummary(tx, bundle.network, bundle.identity)
          })
          return {
            ...bundle,
            explorerUrl: network?.explorerUrl,
            summaries
          }
        })

        sendReply(message, {
          data: {
            confirmed: bundlesList,
          }
        })
      } else {
        sendReply(message, {
          data: {
            error: 'Could not fetch transactions',
          }
        })
      }
    })

    addMessageHandler({ type: 'extension_getAccounts' }, (message) => {
      console.error('SEND ACCOUNT GET ACCOUNTS......')
      sendReply(message, {
        data: {
          accounts,
          networks: allNetworks,
        }
      })
    })

    addMessageHandler({ type: 'extension_changeAccount' }, (message) => {
      onSelectAcc(message.data)
      sendReply(message, {
        data: { ack: true }
      })
    })

    addMessageHandler({ type: 'extension_changeNetwork' }, (message) => {
      setNetwork(message.data)
    })

    addMessageHandler({ type: 'extension_reject' }, (message) => {
      setNetwork(message.data)
    })

    //Handling web3 calls
    addMessageHandler({ type: 'web3Call' }, async (message) => {

      verbose > 0 && console.log(`ambirePC: web3CallRequest`, message)
      const provider = getDefaultProvider(network.rpc)

      const payload = message.data
      const method = payload.method

      let deferredReply = false

      const callTx = payload.params
      let result
      let error
      if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
        result = [selectedAccount]
      } else if (method === 'eth_chainId' || method === 'net_version') {
        result = hexlify(network.chainId)
      } else if (method === 'wallet_requestPermissions') {
        result = [{ parentCapability: 'eth_accounts' }]
      } else if (method === 'wallet_getPermissions') {
        result = [{ parentCapability: 'eth_accounts' }]
      } else if (method === 'wallet_switchEthereumChain') {
        const existingNetwork = allNetworks.find(a => {
          return sanitize2hex(a.chainId) === sanitize2hex(callTx[0]?.chainId)//ethers BN ouputs 1 to 0x01 while some dapps ask for 0x1
        })
        if (existingNetwork) {
          setNetwork(existingNetwork.chainId)
          result = null
        } else {
          error = `chainId ${callTx[0]?.chainId} not supported by ambire wallet`
        }
      } else if (method === 'eth_coinbase') {
        result = selectedAccount
      } else if (method === 'eth_call') {
        result = await provider.call(callTx[0], callTx[1]).catch(err => {
          error = err
        })
      } else if (method === 'eth_getBalance') {
        result = await provider.getBalance(callTx[0], callTx[1]).catch(err => {
          error = err
        })
        if (result) {
          result = sanitize2hex(result)
        }
      } else if (method === 'eth_blockNumber') {
        result = await provider.getBlockNumber().catch(err => {
          error = err
        })
        if (result) result = sanitize2hex(result)
      } else if (method === 'eth_getBlockByHash') {
        if (callTx[1]) {
          result = await provider.getBlockWithTransactions(callTx[0]).catch(err => {
            error = err
          })
          if (result) {
            result.baseFeePerGas = sanitize2hex(result.baseFeePerGas)
            result.gasLimit = sanitize2hex(result.gasLimit)
            result.gasUsed = sanitize2hex(result.gasUsed)
            result._difficulty = sanitize2hex(result._difficulty)
          }
        } else {
          result = await provider.getBlock(callTx[0]).catch(err => {
            error = err
          })
        }
      } else if (method === 'eth_getTransactionByHash') {
        result = await provider.getTransaction(callTx[0]).catch(err => {
          error = err
        })
        if (result) {
          //sanitize
          //need to return hex numbers, provider returns BigNumber
          result.gasLimit = sanitize2hex(result.gasLimit)
          result.gasPrice = sanitize2hex(result.gasPrice)
          result.value = sanitize2hex(result.value)
          result.wait = null
        }
      } else if (method === 'eth_getCode') {
        result = await provider.getCode(callTx[0], callTx[1]).catch(err => {
          error = err
        })
      } else if (method === 'eth_gasPrice') {
        result = await provider.getGasPrice().catch(err => {
          error = err
        })
        if (result) result = sanitize2hex(result)
      } else if (method === 'eth_estimateGas') {
        result = await provider.estimateGas(callTx[0]).catch(err => {
          error = err
        })
        if (result) result = sanitize2hex(result)
      } else if (method === 'eth_getBlockByNumber') {
        result = await provider.getBlock(callTx[0], callTx[1]).catch(err => {
          error = err
        })
        if (result) {
          result.baseFeePerGas = sanitize2hex(result.baseFeePerGas)
          result.gasLimit = sanitize2hex(result.gasLimit)
          result.gasUsed = sanitize2hex(result.gasUsed)
          result._difficulty = sanitize2hex(result._difficulty)
        }
        verbose > 2 && console.log('Result', result, error)
      } else if (method === 'eth_getTransactionReceipt') {
        result = await provider.getTransactionReceipt(callTx[0]).catch(err => {
          error = err
        })
        if (result) {
          result.cumulativeGasUsed = sanitize2hex(result.cumulativeGasUsed)
          result.effectiveGasPrice = sanitize2hex(result.effectiveGasPrice)
          result.gasUsed = sanitize2hex(result.gasUsed)
          result._difficulty = sanitize2hex(result._difficulty)
        }
      } else if (method === 'eth_getTransactionCount') {
        result = await provider.getTransactionCount(callTx[0]).catch(err => {
          error = err
        })
        if (result) result = sanitize2hex(result)
      } else if (method === 'personal_sign') {
        handlePersonalSign(message).catch(err => {
          verbose > 0 && console.log('personal sign error ', err)
          error = err
        })
        deferredReply = true
      } else if (method === 'eth_sign') {
        handlePersonalSign(message).catch(err => {
          verbose > 0 && console.log('personal sign error ', err)
          error = err
        })
        deferredReply = true
      } else if (method === 'eth_sendTransaction') {
        deferredReply = true
        await handleSendTransactions(message).catch(err => {
          error = err
        })
      } else if (method === 'gs_multi_send' || method === 'ambire_sendBatchTransaction') {
        deferredReply = true
        await handleSendTransactions(message).catch(err => {
          error = err
        })
      } else {
        error = 'Method not supported by extension hook: ' + method
      }

      if (error) {
        console.error('throwing error with ', message)
        sendReply(message, {
          data: {
            jsonrpc: '2.0',
            id: payload.id,
            error: error,
          }
        })
      } else if (!deferredReply) {
        let rpcResult = {
          jsonrpc: '2.0',
          id: payload.id,
          result: result,
        }

        verbose > 0 && console.log(`Replying to request with`, rpcResult)

        sendReply(message, {
          data: rpcResult
        })
      }
    })

    //handleSendTx
    const handleSendTransactions = async (message) => {
      const payload = message.data
      const txs = payload.params
      if (txs?.length) {
        for (let i in txs) {
          if (!txs[i].from) txs[i].from = selectedAccount
        }
      } else {
        throw Error('No txs in received payload')
      }

      for (let ix in txs) {
        const internalHookId = `ambex_tx_${payload.id}:${ix}`
        const request = {
          id: internalHookId,
          originalPayloadId: payload.id,
          type: 'eth_sendTransaction',
          isBatch: txs.length > 1,
          txn: txs[ix],
          chainId: network.chainId,
          account: selectedAccount,
          originalMessage: message
        }
        //Do we need reducer here or enough like this?
        setRequests(prevRequests => prevRequests.find(x => x.id === request.id) ? prevRequests : [...prevRequests, request])
      }
    }

    setAmbexSetupRefresh(new Date().getTime())

    return () => {
      console.log('CLEARING ALL QUEUE')
      clear()
    }
  }, [
    selectedAccount,
    network,
    sanitize2hex,
    allNetworks,
    setNetwork,
    handlePersonalSign,
    verbose,
    relayerURL,
    onSelectAcc,
    accounts,
    addToast
  ])

  const portfolioRef = useRef(null)
  portfolioRef.current = portfolio
  const rewardsRef = useRef(null)
  rewardsRef.current = rewardsData

  useEffect(() => {

    // console.log('portfolio updated...', portfolio)
    // console.log('RDATA...', rewardsData)

    if (ambexSetupRefresh) {

      console.log('REFRESH ADD HANDLER', ambexSetupRefresh)

      //Used on extension lifecycle reloading to check if previous ambire injected tabs are still up
      addMessageHandler({ type: 'extension_getBalance' }, async (message) => {
        if (portfolioRef.current.isCurrNetworkBalanceLoading) {
          sendReply(message, {
            data: { loading: true }
          })
        } else {
          sendReply(message, {
            data: {
              balance: portfolioRef.current.balance,
              rewards: rewardsRef.current
            }
          })
        }
      })

      addMessageHandler({ type: 'extension_getAssets' }, (message) => {
        if (portfolioRef.current.isCurrNetworkBalanceLoading) {
          sendReply(message, {
            data: { loading: true }
          })
        } else {
          sendReply(message, {
            data: {
              tokens: portfolioRef.current.tokens
            }
          })
        }
      })
    }

    return () => {
      removeMessageHandler({ type: 'extension_getBalance' })
      removeMessageHandler({ type: 'extension_getAssets' })
    }

  }, [ambexSetupRefresh])

  return {
    sendMessage,
    addMessageHandler,
    removeMessageHandler,
    sendReply,
    requests,
    resolveMany
  }
}
