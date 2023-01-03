import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useToasts } from 'hooks/toasts'

import { SignClient } from '@walletconnect/sign-client'
import { formatJsonRpcError, formatJsonRpcResult } from '@json-rpc-tools/utils'

import {
  UNISWAP_PERMIT_EXCEPTIONS,
  DEFAULT_EIP155_METHODS,
  DEFAULT_EIP155_EVENTS,
  WC2_SUPPORTED_METHODS
} from 'hooks/walletConnect/wcConsts'
import networks from 'consts/networks'

const STORAGE_KEY = 'wc2_state'
const WC2_VERBOSE = process.env.REACT_APP_WC2_VERBOSE || 0

const getDefaultState = () => ({ connections: [], requests: [] })

let client

export default function useWalletConnectV2({ account, chainId, clearWcClipboard, setRequests }) {

  // This is needed cause of the WalletConnect event handlers
  const stateRef = useRef()
  stateRef.current = { account, chainId }

  const [initialized, setInitialized] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  const { addToast } = useToasts()

  const onInitialize = useCallback(async () => {
    try {
      SignClient.init({
        projectId: 'f19f5c8e2b1ea7fbd382583761c167b3',// TODO
        relayUrl: 'wss://relay.walletconnect.com',
        metadata: {
          name: 'Ambire Wallet',
          description: 'Ambire Wallet, non custodial smart wallet',
          url: 'https://wallet.ambire.com/',
          icons: ['https://wallet.ambire.com/logo192.png']
        }
      })
        .then(signClient => {
          client = signClient
          setInitialized(true)
          if (typeof signClient === 'undefined') {
            throw new Error('Client is not initialized')
          }
          if (WC2_VERBOSE) console.log('WC2 signClient initialized')
          return true
        })

    } catch (err) {
      alert(err)
    }
  }, [])

  const [state, dispatch] = useReducer((state, action) => {
    if (action.type === 'updateConnections') return { ...state, connections: action.connections }
    if (action.type === 'connectedNewSession') {
      const existingConnection = state.connections.find(c => c.pairingTopic === action.pairingTopic)
      if (existingConnection) {
        const updatedConnections = state.connections.map(c => {
          if (c.pairingTopic === action.pairingTopic) {
            return {
              ...c,
              sessionTopics: [...c.sessionTopics, action.sessionTopic]
            }
          } else {
            return c
          }
        })

        return {
          ...state,
          connections: [...updatedConnections]
        }
      } else {
        return {
          ...state,
          connections: [...state.connections, {
            connectionId: action.pairingTopic, // rename URI of wc 1
            session: action.session,
            pairingTopic: action.pairingTopic,
            sessionTopics: [action.sessionTopic],
            namespacedChainIds: action.namespacedChainIds,
            proposerPublicKey: action.proposerPublicKey,
          }]
        }
      }
    }
    if (action.type === 'disconnected') {
      const filteredConnections = state.connections.filter(x => x.connectionId !== action.connectionId)

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
        requests: state.requests.filter(x => !action.ids.includes(x.id))
      }
    }
    return { ...state }
  }, null, () => {
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
  })

  const getConnectionFromSessionTopic = useCallback((sessionTopic) => {
    return state.connections.find(c => c.sessionTopics.includes(sessionTopic))
  }, [state])

  const connect = useCallback(async (connectorOpts) => {

    if (!client) {
      if (WC2_VERBOSE) console.log('WC2: Client not initialized')
      return
    }

    const pairingTopicMatches = connectorOpts.uri.match(/wc:([a-f0-9]+)/)
    const pairingTopic = pairingTopicMatches[1]

    const existingPair = client?.pairing.values.find(p => p.topic === pairingTopic)
    if (existingPair) {
      if (WC2_VERBOSE) console.log('WC2: Pairing already active')
      return
    }

    setIsConnecting(true)
    try {
      let res = await client.pair({ uri: connectorOpts.uri })
      if (WC2_VERBOSE) console.log('pairing result', res)
    } catch (e) {
      addToast(e.message)
    }

  }, [addToast])

  const disconnect = useCallback(connectionId => {
    // connector might not be there, either cause we disconnected before,
    // or cause we failed to connect in the first place
    if (!client) {
      if (WC2_VERBOSE) console.log('WC2 disconnect: Client not initialized')
      dispatch({ type: 'disconnected', connectionId })
      return
    }

    const connection = state.connections.find(c => c.connectionId === connectionId)

    if (connection) {
      const session = client.session.values.find(a => a.peer.publicKey === connection.proposerPublicKey)
      if (WC2_VERBOSE) console.log('WC2 disconnect (connection, session)', connection, session)

      if (session) {
        client.disconnect({ topic: session.topic })
      }
    }

    dispatch({ type: 'disconnected', connectionId })

  }, [state])

  const resolveMany = (ids, resolution) => {
    state.requests.forEach(({ id, topic }) => {
      if (ids.includes(id)) {
        if (resolution.success) {
          const response = formatJsonRpcResult(id, resolution.result)
          const respObj = {
            topic: topic,
            response,
          }
          client.respond(respObj).catch(err => {
            addToast(err.message, { error: true })
          })
        } else {
          const response = formatJsonRpcError(id, resolution.message)
          client.respond({
            topic: topic,
            response,
          }).catch(err => {
            addToast(err.message, { error: true })
          })
        }
      }
    })
    dispatch({ type: 'requestsResolved', ids })
  }

  ////////////////////////
  // SESSION HANDLERS START
  ////////////////////////////////////

  const onSessionProposal = useCallback(
    async (proposal) => {

      // Get required proposal data
      const { id, params } = proposal
      const { proposer, requiredNamespaces, relays } = params

      const supportedChains = []
      const usedChains = []
      networks.forEach(n => {
        if (!supportedChains.includes(n.chainId)) {
          supportedChains.push('eip155:' + n.chainId)
        }
      })
      const unsupportedChains = []
      requiredNamespaces.eip155?.chains.forEach(chainId => {
        if (supportedChains.includes(chainId)) {
          usedChains.push(chainId)
        } else {
          unsupportedChains.push(chainId)
        }
      })
      if (unsupportedChains.length) {
        addToast(`Chains not supported ${unsupportedChains.join(',')}`, { error: true })
        if (WC2_VERBOSE) console.log('WC2 : Proposal rejected')
        return client.reject({ proposal })
      }

      const namespaces = {
        eip155: {
          accounts: usedChains.map(a => a + ':' + account),
          methods: DEFAULT_EIP155_METHODS,
          events: DEFAULT_EIP155_EVENTS
        }
      }

      const existingClientSession = client.session.values.find(s => s.peer.publicKey === params.proposer.publicKey)

      clearWcClipboard()
      if (!existingClientSession) {
        if (WC2_VERBOSE) console.log('WC2 Approving client', namespaces)
        client.approve({
          id,
          relayProtocol: relays[0].protocol,
          namespaces
        }).then(approveResult => {
          if (WC2_VERBOSE) console.log('WC2 Approve result', approveResult)
          setIsConnecting(false)
          dispatch({
            type: 'connectedNewSession',
            pairingTopic: params.pairingTopic,
            sessionTopic: approveResult.topic,
            proposerPublicKey: params.proposer.publicKey,
            session: { peerMeta: proposer.metadata },
            namespacedChainIds: usedChains,
            proposal
          })
        }).catch(err => {
          setIsConnecting(false)
          console.error('WC2 Error : ', err.message)
        })
      } else {
        setIsConnecting(false)
      }
    }
    , [account, addToast, clearWcClipboard])

  const onSessionRequest = useCallback(
    async (requestEvent) => {
      if (WC2_VERBOSE) console.log('session_request', requestEvent)
      const { id, topic, params } = requestEvent
      const { request: wcRequest } = params

      const namespacedChainId = (params.chainId || ('eip155:' + stateRef.current.chainId)).split(':')

      const namespace = namespacedChainId[0]
      const chainId = namespacedChainId[1] * 1

      if (namespace !== 'eip155') {
        const err = `Namespace "${namespace}" not compatible`
        addToast(err, { error: true })
        await client.respond({
          topic: requestEvent.topic,
          response: formatJsonRpcError(requestEvent.id, err)
        }).catch(err => {
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
              txn = [{
                to: txn.domain.verifyingContract,
                from: txn.message.from,
                data: txn.message.functionSignature,
                value: txn.message.value || '0x0'
              }]
            }
          } else if (method === 'eth_signTypedData_v4') {
            requestAccount = wcRequest.params[0]
            txn = JSON.parse(wcRequest.params[1])

            // Dealing with Erc20 Permits
            if (txn.primaryType === 'Permit') {
              // If Uniswap, reject the permit and expect a graceful fallback (receiving approve eth_sendTransaction afterwards)
              if (UNISWAP_PERMIT_EXCEPTIONS.some(ex => dappName.toLowerCase().includes(ex.toLowerCase()))) {
                const response = formatJsonRpcError(id, { message: 'Method not found: ' + method, code: -32601 })
                client.respond({
                  topic: topic,
                  response,
                }).catch(err => {
                  addToast(err.message, { error: true })
                })

                return
              } else {
                addToast(`dApp tried to sign a token permit which does not support Smart Wallets`, { error: true })
                return
              }
            }
          }

          if (txn) {
            const request = {
              id,
              type: method,
              dateAdded: new Date().valueOf(),
              connectionId: connection.pairingTopic,
              txn,
              chainId,
              topic,
              account: requestAccount,
              notification: true
            }
            setRequests(prev => [...prev, request])
            if (WC2_VERBOSE) console.log('WC2 request added :', request)
            dispatch({
              type: 'requestAdded', request
            })
          }
        }
      } else {
        const err = `Method "${wcRequest.method}" not supported`
        addToast(err, { error: true })
        await client.respond({
          topic,
          response: formatJsonRpcError(requestEvent.id, err)
        })
      }
    },
    [addToast, getConnectionFromSessionTopic, setRequests]
  )

  const onSessionDelete = useCallback((deletion) => {
    if (typeof client === 'undefined') {
      throw new Error('Client is not initialized')
    }
    const connectionToDelete = getConnectionFromSessionTopic(deletion.topic)
    const sessionToDelete = client.session.values.find(s => connectionToDelete.sessionTopics.includes(s.topic))
    if (sessionToDelete) {
      client.disconnect({
        topic: sessionToDelete.topic
      }).catch(err => {
        console.error('could not disconnect topic ' + deletion.topic)
      })
    }
    dispatch({
      type: 'disconnected',
      connectionId: connectionToDelete.connectionId
    })

  }, [dispatch, getConnectionFromSessionTopic])

////////////////////////
// SESSION HANDLERS STOP
////////////////////////////////////

//rerun for every state change
  useEffect(() => {
    localStorage[STORAGE_KEY] = JSON.stringify(state)

    if (client) {

      // updating active connections
      client.session.values.forEach(session => {
        if (WC2_VERBOSE) console.log('WC2 updating session', session)
        const connection = state.connections.find(c => c.sessionTopics.includes(session.topic))
        if (connection) {

          const namespaces = {
            eip155: {
              // restricting chainIds to WC pairing chainIds, or WC will throw
              accounts: connection.namespacedChainIds?.map(cid => `${cid}:${account}`) || [],
              methods: DEFAULT_EIP155_METHODS,
              events: DEFAULT_EIP155_EVENTS,
            }
          }
          client.update({
            topic: session.topic,
            namespaces
          }).then(updateResult => {
            if (WC2_VERBOSE) console.log('WC2 Updated ', updateResult)
          }).catch(err => {
            console.log('WC2 Update Error: ' + err.message, session)
          })
        } else {
          if (WC2_VERBOSE) console.log('WC2 : session topic not found in connections ' + session.topic)
        }
      })
    }

  }, [state, account, chainId])

// Initialization effects
  useEffect(() => {

    if (!initialized) {
      onInitialize().then(res => {
        if (WC2_VERBOSE) console.log('WC2 Client INITIALIZED')
      }).catch(err => {
        console.error('WC2 Inititialization error: ' + err.message)
      })
    }

  }, [connect, account, onInitialize, initialized])

  useEffect(() => {
    if (initialized) {
      client.on('session_proposal', onSessionProposal)
      client.on('session_request', onSessionRequest)
      client.on('session_delete', onSessionDelete)

      return () => {
        client.removeListener('session_proposal', onSessionProposal)
        client.removeListener('session_request', onSessionRequest)
        client.removeListener('session_delete', onSessionDelete)
      }
    }

  }, [connect, initialized, onSessionProposal, onSessionRequest, onSessionDelete, dispatch, account])

  return {
    connections: state.connections,
    requests: state.requests,
    isConnecting,
    resolveMany,
    connect, disconnect
  }
}
