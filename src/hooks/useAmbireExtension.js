import { useCallback, useEffect, useState, useRef } from 'react'
import { useToasts } from '../hooks/toasts'

import { getDefaultProvider, BigNumber } from 'ethers'

import {
  setupAmbexMessenger,
  sendMessage,
  addMessageHandler,
  clear,
  sendReply
} from "../lib/ambexMessenger"

const STORAGE_KEY = 'ambire_extension_state'

export default function useAmbireExtension({ allNetworks, setNetwork, selectedAccount, network, verbose = 1 }) {
  // One connector at a time
  const connector = useRef(null)

  const { addToast } = useToasts()

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

  const number2hex = (any) => {
    if (verbose) console.warn(`instanceof of any is ${any instanceof BigNumber}`)
    if (any instanceof BigNumber) {
      return any.toHexString()
    } else {
      if (any === undefined) {
        return any
      }
      return BigNumber.from(any).toHexString()
    }
  }

  const handlePersonalSign = async (message) => {
    const payload = message.data
    verbose > 0 && console.log("AmbEx requested signMessage", payload)

    if (!payload) {
      console.error('AmbExHook: no payload', message)
      return
    }

    const id = 'ambex_' + payload.id
    let messageToSign = payload?.params?.message || payload?.params[0]
    if (payload.method === "eth_sign") {
      messageToSign = payload?.params[1]
    }
    if (!messageToSign) {
      console.error('AmbExHook: no message in received payload')
      return
    }

    const request = {
      id,
      upstreamInternalId: payload.internalId,
      originalPayloadId: payload.id,
      type: payload.method,
      txn: messageToSign,
      chainId: stateRef.current.network.chainId,
      account: stateRef.current.selectedAccount,
      originalMessage: message
    }

    verbose > 0 && console.log("sending personal sign to queue", request)

    setRequests(prevRequests => prevRequests.find(x => x.id === request.id) ? prevRequests : [...prevRequests, request])
  }

  const resolveMany = (ids, resolution) => {
    for (let req of requests.filter(x => ids.includes(x.id))) {

      //console.log('ambireEx hook resolution', resolution)
      //console.log('request of resol', req)

      let rpcResult = {
        jsonrpc: "2.0",
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

    setRequests(prevRequests => prevRequests.filter(x => !ids.includes(x.id)))
  }

  // Side effects that will run on every state change/rerender
  useEffect(() => {
    localStorage[STORAGE_KEY] = JSON.stringify(requests)
  }, [requests])

  useEffect(() => {

    sendMessage({
      to: "background",
      type: "ambireWalletAccountChanged",
      data: {
        account: selectedAccount
      }
    })

    sendMessage({
      to: "background",
      type: "ambireWalletChainChanged",
      data: {
        chainId: network.chainId
      }
    })

    verbose > 0 && console.log("listening to msgs")
    setupAmbexMessenger("ambirePageContext")

    addMessageHandler({ type: "ping" }, (message) => {
      sendReply(message, {
        data: selectedAccount + " PONG!!!"
      })
    })

    addMessageHandler({ type: "ambireContentScriptInjected" }, (message) => {
      sendMessage({
        to: "background",
        type: "ambirePageContextInjected",
        data: {
          account: selectedAccount,
          chainId: network.chainId
        }
      })
    })

    addMessageHandler({ type: "web3Call" }, async (message) => {

      verbose > 0 && console.log(`web3CallRequest`, message)
      const provider = getDefaultProvider(network.rpc)

      const payload = message.data
      const method = payload.method

      let deferredReply = false

      const callTx = payload.params//0 == tx, 1 == blockNum
      let result
      let error
      if (method === "eth_accounts" || method === "eth_requestAccounts") {
        result = [selectedAccount]
      } else if (method === "eth_chainId" || method === "net_version") {
        result = network.chainId
      } else if (method === "wallet_requestPermissions") {
        result = [{ parentCapability: "eth_accounts" }]
      } else if (method === "wallet_getPermissions") {
        result = [{ parentCapability: "eth_accounts" }]
      } else if (method === "wallet_switchEthereumChain") {
      debugger;
        const existingNetwork = allNetworks.find(a => {
          return number2hex(a.chainId) === callTx[0]?.chainId
        })
        if (existingNetwork) {
          setNetwork(existingNetwork.chainId)
          result = null
        } else {
          error = `chainId ${callTx[0]?.chainId} not supported by ambire wallet`
        }
      } else if (method === "eth_coinbase") {
        result = selectedAccount
      } else if (method === "eth_call") {
        result = await provider.call(callTx[0], callTx[1]).catch(err => {
          error = err
        })
      } else if (method === "eth_getBalance") {
        result = await provider.getBalance(callTx[0], callTx[1]).catch(err => {
          error = err
        })
        if (result) {
          result = number2hex(result)
        }
      } else if (method === "eth_blockNumber") {
        result = await provider.getBlockNumber().catch(err => {
          error = err
        })
        if (result) result = number2hex(result)
      } else if (method === "eth_getBlockByHash") {
        if (callTx[1]) {
          result = await provider.getBlockWithTransactions(callTx[0]).catch(err => {
            error = err
          })
          if (result) {
            result.baseFeePerGas = number2hex(result.baseFeePerGas)
            result.gasLimit = number2hex(result.gasLimit)
            result.gasUsed = number2hex(result.gasUsed)
            result._difficulty = number2hex(result._difficulty)
          }
        } else {
          result = await provider.getBlock(callTx[0]).catch(err => {
            error = err
          })
        }
      } else if (method === "eth_getTransactionByHash") {
        result = await provider.getTransaction(callTx[0]).catch(err => {
          console.error("getTxByHash err...", err)
          error = err
        })
        if (result) {
          result.gasLimit = number2hex(result.gasLimit)
          result.gasPrice = number2hex(result.gasPrice)
          result.value = number2hex(result.value)
          result.wait = null
        }
      } else if (method === "eth_getCode") {
        result = await provider.getCode(callTx[0], callTx[1]).catch(err => {
          error = err
        })
      } else if (method === "eth_gasPrice") {
        result = await provider.getGasPrice().catch(err => {
          error = err
        })
        if (result) result = number2hex(result)
      } else if (method === "eth_estimateGas") {
        result = await provider.estimateGas(callTx[0]).catch(err => {
          error = err
        })
        if (result) result = number2hex(result)
      } else if (method === "eth_getBlockByNumber") {
        result = await provider.getBlock(callTx[0], callTx[1]).catch(err => {
          console.log("get block by number err ", err)
          error = err
        })
        if (result) {
          result.baseFeePerGas = number2hex(result.baseFeePerGas)
          result.gasLimit = number2hex(result.gasLimit)
          result.gasUsed = number2hex(result.gasUsed)
          result._difficulty = number2hex(result._difficulty)
        }
        verbose > 0 && console.log("RES", result, error)
      } else if (method === "eth_getTransactionReceipt") {
        result = await provider.getTransactionReceipt(callTx[0]).catch(err => {
          error = err
        })
        if (result) {
          result.cumulativeGasUsed = number2hex(result.cumulativeGasUsed)
          result.effectiveGasPrice = number2hex(result.effectiveGasPrice)
          result.gasUsed = number2hex(result.gasUsed)
          result._difficulty = number2hex(result._difficulty)
        }
      } else if (method === "eth_getTransactionCount") {
        result = await provider.getTransactionCount(callTx[0]).catch(err => {
          error = err
        })
        if (result) result = number2hex(result)
      } else if (method === "personal_sign") {
        handlePersonalSign(message).catch(err => {
          verbose > 0 && console.log("personal sign error ", err)
          error = err
        })
        deferredReply = true
      } else if (method === "eth_sign") {
        handlePersonalSign(message).catch(err => {
          verbose > 0 && console.log("personal sign error ", err)
          error = err
        })
        deferredReply = true
      } else if (method === "eth_sendTransaction") {

        const internalHookId = 'ambex_tx_' + payload.id
        const txs = payload.params
        if (txs?.length) {
          for (let i in txs) {
            if (!txs[i].from) txs[i].from = selectedAccount
          }
        } else {
          error = "No txs in received payload"
        }

        const request = {
          id: internalHookId,
          upstreamInternalId: message.data.internalId,
          originalPayloadId: payload.id,
          type: 'eth_sendTransaction',
          txn: txs[0], //if anyone finds a dapp that sends a bundle, please reach me out
          chainId: network.chainId,
          account: selectedAccount,
          originalMessage: message
        }

        deferredReply = true
        setRequests(prevRequests => prevRequests.find(x => x.id === request.id) ? prevRequests : [...prevRequests, request])
      } else {
        error = "Method not supported by extension hook: " + method
      }

      if (error) {
        console.error("throwing error with ", message)
        sendReply(message, {
          data: {
            jsonrpc: "2.0",
            id: payload.id,
            error: error,
          }
        })
      } else if (!deferredReply) {
        let rpcResult = {
          jsonrpc: "2.0",
          id: payload.id,
          result: result,
        }

        verbose > 0 && console.log(`Replying to request with`, rpcResult)

        sendReply(message, {
          data: rpcResult
        })
      }
    })

    return () => {
      clear()
    }
  }, [selectedAccount, network])

  return {
    requests,
    resolveMany
  }
}
