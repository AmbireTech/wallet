import { useCallback, useEffect, useState, useRef } from 'react'

import { getDefaultProvider, BigNumber } from 'ethers'

import {
  setupAmbexMessenger,
  sendMessage,
  addMessageHandler,
  clear,
  sendReply
} from 'lib/ambexMessenger'

const STORAGE_KEY = 'ambire_extension_state'

export default function useAmbireExtension({ allNetworks, setNetwork, selectedAccount, network, verbose = 1 }) {

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
    })

    sendMessage({
      to: 'background',
      type: 'ambireWalletChainChanged',
      data: {
        chainId: network.chainId
      }
    })

    verbose > 2 && console.log('listening to msgs')

    //Not relevant for ambex but useful for debug purposes. Leave it?
    addMessageHandler({ type: 'ping' }, (message) => {
      sendReply(message, {
        data: selectedAccount + ' Ambex PONG!!!'
      })
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
      })
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
        result = network.chainId
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

    return () => {
      clear()
    }
  }, [selectedAccount, network, sanitize2hex, allNetworks, setNetwork, handlePersonalSign, verbose])

  return {
    requests,
    resolveMany
  }
}
