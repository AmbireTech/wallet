import { useCallback, useEffect, useState, useRef } from 'react'
import { useToasts } from '../hooks/toasts'

import { getDefaultProvider, BigNumber } from 'ethers'

const STORAGE_KEY = 'ambire_extension_state'

export default function useAmbireExtension({ selectedAccount, network, verbose = 1 }) {
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
    console.warn(`instanceof of any is ${any instanceof BigNumber}`)
    if (any instanceof BigNumber) {
      return any.toHexString()
    } else {
      if (any === undefined) {
        return any
      }
      return BigNumber.from(any).toHexString()
    }
  }

  const handlePersonalSign = async (msg) => {
    verbose > 0 && console.log("AmbEx requested signMessage", msg)

    const payload = msg?.data?.payload
    if (!payload) {
      console.error('AmbExHook: no payload')
      return
    }

    const id = 'ambex_' + payload.id
    let message = payload?.params?.message || payload?.params[0]
    if (payload.method === "eth_sign") {
      message = payload?.params[1]
    }
    if (!message) {
      console.error('AmbExHook: no message in received payload')
      return
    }

    const request = {
      id,
      upstreamInternalId: msg.data.internalId,
      originalPayloadId: payload.id,
      type: payload.method,
      txn: message,
      chainId: stateRef.current.network.chainId,
      account: stateRef.current.selectedAccount
    }

    console.log("sending personal sign to queue", request)

    setRequests(prevRequests => prevRequests.find(x => x.id === request.id) ? prevRequests : [...prevRequests, request])
  }

  const eventListener = async function (selectedAccount, network, msg) {

    console.log(`ambireExtension msg`, msg)
    const provider = getDefaultProvider(network.rpc)
    if (msg.data && msg.data.type === "ambireCSToAmbirePCRequest") {
      const payload = msg.data.payload
      const method = payload.method

      if (method === "personal_sign") {
        debugger
      }

      const callTx = payload.params//0 == tx, 1 == blockNum
      let result
      let error
      if (method === "eth_accounts" || method === "eth_requestAccounts") {
        result = [selectedAccount]
      } else if (method === "eth_chainId" || method === "net_version") {
        console.log("chain id requested", network)
        result = network.chainId
      } else if (method === "wallet_requestPermissions") {
        result = [{ parentCapability: "eth_accounts" }]
      } else if (method === "wallet_getPermissions") {
        result = [{ parentCapability: "eth_accounts" }]
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
        console.log(callTx)
        result = await provider.getTransaction(callTx[0]).catch(err => {
          console.error("getTxByHash err...", err)
          error = err
        })
        console.log(result)
        if (result) {
          result.gasLimit = number2hex(result.gasLimit)
          result.gasPrice = number2hex(result.gasPrice)
          result.value = number2hex(result.value)
          result.wait = null
        }
        console.log(result)
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
        console.log("GET BLOCK BY NUM", callTx)
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
        console.log("RES", result, error)
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
      } else if (method === "personal_sign") {
        handlePersonalSign(msg).catch(err => {
          console.log("personal sign error ", err)
          error = err
        })
        result = null
        debugger
      } else if (method === "eth_sign") {
        handlePersonalSign(msg).catch(err => {
          console.log("personal sign error ", err)
          error = err
        })
        result = null
      } else if (method === "eth_sendTransaction") {

        const internalHookId = 'ambex_tx_' + payload.id
        const txs = payload.params
        if (txs?.length) {
          for (let i in txs) {
            if (!txs[i].from) txs[i].from = selectedAccount
          }
        } else {
          console.error('AmbEx: no txs in received payload')
          return
        }

        const request = {
          id: internalHookId,
          upstreamInternalId: msg.data.internalId,
          originalPayloadId: payload.id,
          type: 'eth_sendTransaction',
          txn: txs[0], //if anyone finds a dapp that sends a bundle, please reach me out
          chainId: network.chainId,
          account: selectedAccount
        }

        result = null
        setRequests(prevRequests => prevRequests.find(x => x.id === request.id) ? prevRequests : [...prevRequests, request])
      } else {
        error = "Method not supported by extension hook: " + method
      }

      if (result) {
        let rpcResult = {
          jsonrpc: "2.0",
          id: msg.data.payload.id,
          result: result,
        }
        if (error) {
          console.error("throwing error with ", msg)
          rpcResult = {
            jsonrpc: "2.0",
            id: msg.data.payload.id,
            error: error,
          }
        }

        console.log(`Replying to CS`)
        console.log(rpcResult)

        window.postMessage({
          type: "ambirePCToAmbireCSResponse",
          internalId: msg.data.internalId,
          payload: rpcResult
        })
      }
    } else if (msg.data && msg.data.type === "pingAmbireWallet") {
      debugger
      window.postMessage({ type: "pongFromAmbireWallet", id: msg.data.id })
    }
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
        rpcResult.error = {message: 'Nothing to resolve'}
        rpcResult.success = false
      } else if (!resolution.success) {
        rpcResult.error = {message: resolution.message}
        rpcResult.success = false
      } else { //onSuccess
        rpcResult.success = true
        rpcResult.txId = resolution.result
        rpcResult.hash = resolution.result
        rpcResult.result = resolution.result
      }

      window.postMessage({
        type: "ambirePCToAmbireCSResponse",
        internalId: req.upstreamInternalId,
        payload: rpcResult
      })
    }

    setRequests(prevRequests => prevRequests.filter(x => !ids.includes(x.id)))
  }

  // Side effects that will run on every state change/rerender
  useEffect(() => {
    localStorage[STORAGE_KEY] = JSON.stringify(requests)
  }, [requests])

  useEffect(() => {
    const eventListenerWrapper = (msg) => {
      eventListener(selectedAccount, network, msg).catch(err => {
        window.postMessage({
          type: "ambirePCToAmbireCSResponse",
          internalId: msg.data.internalId,
          payload: {
            jsonrpc: "2.0",
            id: msg.data.payload.id,
            error: err,
          }
        })
      })
    }

    window.postMessage({
      type: "chainChanged",
      chainId: network.chainId
    })

    window.postMessage({
      type: "accountsChanged",
      account: selectedAccount
    })

    console.log("listening to msgs")
    window.addEventListener("message", eventListenerWrapper)
    return () => {
      window.removeEventListener("message", eventListenerWrapper)
    }
  }, [selectedAccount, network])

  return {
    requests,
    resolveMany
  }
}
