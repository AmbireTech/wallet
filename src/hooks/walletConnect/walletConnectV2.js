import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useToasts } from 'hooks/toasts'

import { Core } from '@walletconnect/core'
import { getSdkError } from '@walletconnect/utils'
import { Web3Wallet } from '@walletconnect/web3wallet'
import { formatJsonRpcError, formatJsonRpcResult } from '@json-rpc-tools/utils'

import {
  UNISWAP_PERMIT_EXCEPTIONS,
  DEFAULT_EIP155_EVENTS,
  WC2_SUPPORTED_METHODS
} from 'hooks/walletConnect/wcConsts'
import networks from 'consts/networks'
import { ethers } from 'ethers'

const STORAGE_KEY = 'wc2_state'
const WC2_VERBOSE = process.env.REACT_APP_WC2_VERBOSE || 0

const getDefaultState = () => ({ connections: [], requests: [] })

const metadata = {
  name: 'Ambire Wallet',
  description: 'Ambire Wallet, non custodial smart wallet',
  url: 'https://wallet.ambire.com/',
  icons: ['https://wallet.ambire.com/logo192.png']
}

export default function useWalletConnectV2({
  account,
  chainId,
  clearWcClipboard,
  setRequests,
  setNetwork,
  allNetworks
}) {
  // This is needed cause of the WalletConnect event handlers
  const stateRef = useRef()
  stateRef.current = { account, chainId }
  const [initialized, setInitialized] = useState(false)
  const [web3wallet, setWeb3Wallet] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)

  const { addToast } = useToasts()

  const initialize = useCallback(async () => {
    const core = new Core({
      projectId: 'bef1db6c71e4c022d5cfa260f8e95e58',
      relayUrl: 'wss://relay.walletconnect.com'
    })

    const web3walletResp = await Web3Wallet.init({
      core,
      metadata
    })

    setWeb3Wallet(web3walletResp)
    setInitialized(true)
  }, [])

  useEffect(() => {
    if (initialized) return

    initialize()
  }, [initialized, initialize])

  const [state, dispatch] = useReducer(
    (state, action) => {
      if (action.type === 'updateConnections') return { ...state, connections: action.connections }
      if (action.type === 'connectedNewSession') {
        const existingConnection = state.connections.find(
          (c) => c.connectionId === action.connectionId
        )
        if (existingConnection) {
          const updatedConnections = state.connections.map((c) => {
            if (c.connectionId === action.connectionId) {
              return {
                ...c,
                topic: action.topic
              }
            }
            return c
          })

          return {
            ...state,
            connections: [...updatedConnections]
          }
        }
        return {
          ...state,
          connections: [
            ...state.connections,
            {
              connectionId: action.connectionId, // rename URI of wc 1 (same as pairingTopic)
              session: action.session,
              topic: action.topic
            }
          ]
        }
      }
      if (action.type === 'disconnected') {
        const filteredConnections = state.connections.filter((x) => action.topic !== x.topic)

        return {
          ...state,
          connections: filteredConnections
        }
      }
      if (action.type === 'requestAdded') {
        if (state.requests.find(({ id }) => id === action.request.id)) return { ...state }
        return { ...state, requests: [...state.requests, action.request] }
      }
      if (action.type === 'requestsResolved') {
        return {
          ...state,
          requests: state.requests.filter((x) => !action.ids.includes(x.id))
        }
      }
      return { ...state }
    },
    null,
    () => {
      const json = localStorage[STORAGE_KEY]

      if (!json) return getDefaultState()
      try {
        return {
          ...getDefaultState(),
          ...JSON.parse(json)
        }
      } catch (e) {
        console.error(e)
        return getDefaultState()
      }
    }
  )

  const getConnectionFromSessionTopic = useCallback(
    (topic) => {
      return state.connections.find((c) => c.connectionId === topic || c.topic === topic)
    },
    [state]
  )

  const connect = useCallback(
    async (connectorOpts) => {
      if (!web3wallet) {
        if (WC2_VERBOSE) console.log('WC2: Web3Wallet not initialized')
        return
      }

      try {
        const res = await web3wallet.core.pairing.pair({ uri: connectorOpts.uri })

        if (WC2_VERBOSE) console.log('pairing result', res)
      } catch (e) {
        console.log('WC2: Pairing error (code)', e)

        const topic = connectorOpts.uri.match(/:.+@/)[0].replace(/[:@]/g, '')
        const activeSession = getConnectionFromSessionTopic(topic)

        if (e.toString().includes('Pairing already exists') && !activeSession) {
          addToast('This URI has expired, please get a new one from the dApp', { error: true })
        } else {
          addToast(e.message, { error: true })
        }
      }
    },
    [web3wallet, addToast, getConnectionFromSessionTopic]
  )

  const disconnect = useCallback(
    async (topic) => {
      setIsConnecting(true)
      // connector might not be there, either cause we disconnected before,
      // or cause we failed to connect in the first place
      if (!web3wallet) {
        if (WC2_VERBOSE) console.log('WC2 disconnect: Web3Wallet not initialized')
        dispatch({ type: 'disconnected', topic })
        setIsConnecting(false)
        return
      }

      if (topic) {
        if (WC2_VERBOSE) console.log('WC2 disconnect (topic)', topic)
        try {
          await web3wallet.disconnectSession({
            topic,
            reason: getSdkError('USER_DISCONNECTED')
          })
          dispatch({ type: 'disconnected', topic })
        } catch (e) {
          console.log('WC2 disconnect error', e)
        }
        setIsConnecting(false)
      }
    },
    [web3wallet]
  )

  const resolveMany = (ids, resolution) => {
    state.requests.forEach(({ id, topic }) => {
      if (ids.includes(id)) {
        if (resolution.success) {
          const response = formatJsonRpcResult(id, resolution.result)
          const respObj = {
            topic,
            response
          }
          web3wallet.respondSessionRequest(respObj).catch((err) => {
            addToast(err.message, { error: true })
          })
        } else {
          const response = formatJsonRpcError(id, resolution.message)
          web3wallet
            .respondSessionRequest({
              topic,
              response
            })
            .catch((err) => {
              addToast(err.message, { error: true })
            })
        }
      }
    })
    dispatch({ type: 'requestsResolved', ids })
  }

  /// /////////////////////
  // SESSION HANDLERS START
  /// /////////////////////////////////

  const onSessionProposal = useCallback(
    async (proposal) => {
      // Get required proposal data
      const { id, params } = proposal
      const { proposer, relays, optionalNamespaces, requiredNamespaces } = params

      setIsConnecting(true)
      const supportedChains = []

      networks.forEach((n) => {
        if (!supportedChains.includes(n.chainId)) {
          supportedChains.push(`eip155:${n.chainId}`)
        }
      })

      const incomingNamespaces = optionalNamespaces
        ? optionalNamespaces.eip155
        : requiredNamespaces.eip155

      const namespaces = {
        eip155: {
          chains: supportedChains,
          accounts: supportedChains.map((a) => `${a}:${account}`),
          methods: incomingNamespaces.methods,
          events: incomingNamespaces.events
        }
      }

      const existingClientSession = web3wallet.getActiveSessions()[params.pairingTopic]

      clearWcClipboard()
      if (!existingClientSession) {
        if (WC2_VERBOSE) console.log('WC2 Approving', namespaces)

        try {
          const session = await web3wallet.approveSession({
            id,
            namespaces,
            relayProtocol: relays[0].protocol
          })

          if (WC2_VERBOSE) console.log('WC2 Approve result', session)
          setIsConnecting(false)
          dispatch({
            type: 'connectedNewSession',
            connectionId: params.pairingTopic,
            topic: session.topic,
            session: { peerMeta: proposer.metadata }
          })
        } catch (err) {
          setIsConnecting(false)
          console.error('WC2 Error : ', err.message)
        }
      } else {
        setIsConnecting(false)
      }
    },
    [web3wallet, account, clearWcClipboard]
  )

  const onSessionRequest = useCallback(
    async (requestEvent) => {
      if (WC2_VERBOSE) console.log('session_request', requestEvent)
      const { id, topic, params } = requestEvent
      const { request: wcRequest } = params

      const namespacedChainId = (params.chainId || `eip155:${stateRef.current.chainId}`).split(':')

      const namespace = namespacedChainId[0]
      const requestChainId = namespacedChainId[1] * 1

      const supportedNetwork = allNetworks.find((a) => a.chainId === requestChainId)

      if (supportedNetwork && chainId !== requestChainId) {
        setNetwork(supportedNetwork.chainId)
      }

      if (namespace !== 'eip155') {
        const err = `Namespace "${namespace}" not compatible`
        addToast(err, { error: true })
        await web3wallet
          .respondSessionRequest({
            topic: requestEvent.topic,
            response: formatJsonRpcError(requestEvent.id, err)
          })
          .catch((err) => {
            addToast(err.message, { error: true })
          })
        return
      }

      if (WC2_SUPPORTED_METHODS.includes(wcRequest.method)) {
        let txn
        let requestAccount
        let method = wcRequest.method
        if (WC2_VERBOSE) console.log('requestEvent.request.method', method)

        const connection = getConnectionFromSessionTopic(topic)

        if (connection) {
          const dappName = connection.session?.peerMeta?.name || ''
          if (method === 'personal_sign' || wcRequest.method === 'eth_sign') {
            txn = wcRequest.params[wcRequest.method === 'personal_sign' ? 0 : 1]
            requestAccount = wcRequest.params[wcRequest.method === 'personal_sign' ? 1 : 0]
          } else if (method === 'eth_sendTransaction') {
            requestAccount = wcRequest.params[0].from
            txn = wcRequest.params[0]
          } else if (method === 'eth_signTypedData') {
            requestAccount = wcRequest.params[0]
            txn = JSON.parse(wcRequest.params[1])

            if (txn.primaryType === 'MetaTransaction') {
              // either this, either declaring a method var, ONLY for this case
              method = 'eth_sendTransaction'
              txn = [
                {
                  to: txn.domain.verifyingContract,
                  from: txn.message.from,
                  data: txn.message.functionSignature,
                  value: txn.message.value || '0x0'
                }
              ]
            }
          } else if (method === 'eth_signTypedData_v4') {
            requestAccount = wcRequest.params[0]
            txn = JSON.parse(wcRequest.params[1])

            // Dealing with Erc20 Permits
            if (txn.primaryType === 'Permit') {
              // If Uniswap, reject the permit and expect a graceful fallback (receiving approve eth_sendTransaction afterwards)
              if (
                UNISWAP_PERMIT_EXCEPTIONS.some((ex) =>
                  dappName.toLowerCase().includes(ex.toLowerCase())
                )
              ) {
                const response = formatJsonRpcError(id, {
                  message: `Method not found: ${method}`,
                  code: -32601
                })
                web3wallet
                  .respondSessionRequest({
                    topic,
                    response
                  })
                  .catch((err) => {
                    addToast(err.message, { error: true })
                  })

                return
              }
              addToast('dApp tried to sign a token permit which does not support Smart Wallets', {
                error: true
              })
              return
            }
          } else if (method === 'wallet_addEthereumChain') {
            const incomingChainId = wcRequest.params[0]

            // TODO: setNetwork with the incoming chainId
            console.log(incomingChainId, networks)
          }

          if (txn && ethers.utils.isAddress(requestAccount)) {
            const request = {
              id,
              type: method,
              dateAdded: new Date().valueOf(),
              connectionId: connection.connectionId,
              txn,
              chainId: requestChainId,
              topic,
              account: ethers.utils.getAddress(requestAccount),
              notification: true,
              dapp: connection.session?.peerMeta
                ? {
                    name: connection.session.peerMeta.name,
                    description: connection.session.peerMeta.description,
                    icons: connection.session.peerMeta.icons,
                    url: connection.session.peerMeta.url
                  }
                : null
            }
            setRequests((prev) => [...prev, request])
            if (WC2_VERBOSE) console.log('WC2 request added :', request)
            dispatch({
              type: 'requestAdded',
              request
            })
          }
        }
      } else {
        const err = `Method "${wcRequest.method}" not supported`
        addToast(err, { error: true })
        await web3wallet.respondSessionRequest({
          topic,
          response: formatJsonRpcError(requestEvent.id, err)
        })
      }
    },
    [
      web3wallet,
      addToast,
      getConnectionFromSessionTopic,
      setRequests,
      allNetworks,
      setNetwork,
      chainId
    ]
  )

  const onSessionDelete = useCallback(
    (deletion) => {
      setIsConnecting(true)
      /* 
      We don't need to disconnect, because it happens internally-
      https://github.com/WalletConnect/walletconnect-monorepo/issues/1983#issuecomment-1431252320
      We only need to update the state on our side. 
    */
      const connection = getConnectionFromSessionTopic(deletion.topic)

      if (connection) {
        addToast(`Session with ${connection.session.peerMeta.name} ended from the dApp`)
      }

      dispatch({ type: 'disconnected', topic: deletion.topic })
      setIsConnecting(false)
    },
    [getConnectionFromSessionTopic, addToast]
  )

  /// /////////////////////
  // SESSION HANDLERS STOP
  /// /////////////////////////////////

  // rerun for every state change
  useEffect(() => {
    localStorage[STORAGE_KEY] = JSON.stringify(state)

    if (web3wallet) {
      // updating active connections
      const sessions = web3wallet.getActiveSessions()

      if (!sessions || (sessions && Object.keys(sessions).length === 0)) return

      Object.keys(sessions).map(async (topic) => {
        const session = web3wallet.getActiveSessions()[topic]

        if (WC2_VERBOSE) console.log('WC2 updating session', session)
        const connection = state.connections.find((c) => c.topic === session.topic)
        if (connection) {
          const supportedChains = []

          networks.forEach((n) => {
            if (!supportedChains.includes(n.chainId)) {
              supportedChains.push(`eip155:${n.chainId}`)
            }
          })

          const namespaces = {
            eip155: {
              chains: supportedChains,
              accounts: supportedChains.map((a) => `${a}:${account}`),
              methods: session.namespaces?.eip155?.methods || WC2_SUPPORTED_METHODS,
              events: session.namespaces?.eip155?.events || DEFAULT_EIP155_EVENTS
            }
          }

          // We need to update the session with the new namespaces before emitting events
          try {
            await web3wallet.updateSession({
              topic: session.topic,
              namespaces
            })
          } catch (err) {
            console.error('WC2 : could not update session', err)
          }

          // We need to emit chainChanged event to update the chainId in the dapp
          const payload = {
            topic: session.topic,
            event: {
              name: 'chainChanged',
              data: [chainId]
            },
            chainId: `eip155:${chainId}`
          }

          await web3wallet.emitSessionEvent(payload)

          // We need to emit accountsChanged event to update the account in the dapp
          await web3wallet.emitSessionEvent({
            ...payload,
            event: {
              name: 'accountsChanged',
              data: account ? [account] : []
            }
          })
        } else if (WC2_VERBOSE)
          console.log(`WC2 : session topic not found in connections ${session.topic}`)
      })
    }
  }, [web3wallet, state, account, chainId])

  const onSessionEvent = useCallback((event) => {
    // @TODO: handle events
    console.log('event', event)
  }, [])

  useEffect(() => {
    if (initialized) {
      web3wallet.on('session_proposal', onSessionProposal)
      web3wallet.on('session_request', onSessionRequest)
      web3wallet.on('session_delete', onSessionDelete)
      web3wallet.on('session_event', onSessionEvent)

      return () => {
        web3wallet.removeListener('session_proposal', onSessionProposal)
        web3wallet.removeListener('session_request', onSessionRequest)
        web3wallet.removeListener('session_delete', onSessionDelete)
        web3wallet.removeListener('session_event', onSessionEvent)
      }
    }
  }, [
    web3wallet,
    initialized,
    connect,
    onSessionProposal,
    onSessionRequest,
    onSessionDelete,
    dispatch,
    onSessionEvent,
    account
  ])

  return {
    connections: state.connections,
    requests: state.requests,
    isConnecting,
    resolveMany,
    connect,
    disconnect
  }
}
