import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useToasts } from 'hooks/toasts'
import { isFirefox } from 'lib/isFirefox'

import { SignClient } from '@walletconnect/sign-client'
import { formatJsonRpcError, formatJsonRpcResult } from '@json-rpc-tools/utils'

import networks from 'consts/networks'

import {
  DEFAULT_EIP155_METHODS,
  DEFAULT_EIP155_EVENTS,
} from 'consts/walletConnectConsts'

const STORAGE_KEY = 'wc2_state'

const WC2_SUPPORTED_METHODS = [
  'eth_sendTransaction',
  'personal_sign',
  'eth_signTypedData',
  'eth_sign'
]

const getDefaultState = () => ({ connections: [], requests: [] })

let client

export default function useWalletConnectV2({ account, chainId, onCallRequest }) {

  // This is needed cause of the WalletConnect event handlers
  const stateRef = useRef()
  stateRef.current = { account, chainId }

  const getConnectionFromSessionTopic = useCallback((sessionTopic) => {
    return state.connections.find(c => c.sessionTopics.includes(sessionTopic))
  }, [])

  const [initialized, setInitialized] = useState(false)

  const { addToast } = useToasts()

  const onInitialize = useCallback(async () => {
    try {

      SignClient.init({
        projectId: '0ambirewallet123456789',
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
          console.log('WC2 signClient initialized')
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

  const connect = useCallback(async (connectorOpts) => {

    const pairingTopicMatches = connectorOpts.uri.match(/wc:([a-f0-9]+)/)
    const pairingTopic = pairingTopicMatches[1]

    const existingPair = client?.pairing.values.find(p => p.topic === pairingTopic)
    if (existingPair) {
      console.log('WC2: Pairing already active')
      return
    }

    try {
      let res = await client.pair({ uri: connectorOpts.uri })
      console.log('pairing result', res)
    } catch (e) {
      addToast(e.message)
    }

  }, [addToast])

  //TODO
  const disconnect = useCallback(connectionId => {
    // connector might not be there, either cause we disconnected before,
    // or cause we failed to connect in the first place

    const connection = state.connections.find(c => c.connectionId === connectionId)

    if (connection) {
      const session = client.session.values.find(a => a.peer.publicKey === connection.proposerPublicKey)

      if (session) {
        client.disconnect(session)
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
        return client.reject({ proposal })
      }

      const unsupportedMethods = []
      requiredNamespaces.eip155?.methods.forEach(method => {
        if (DEFAULT_EIP155_METHODS.includes(method)) return
        unsupportedMethods.push(method)
      })
      if (unsupportedMethods.length) {
        // TODO PASS?
        //return client.reject({ proposal })
      }

      const namespaces = {
        eip155: {
          accounts: usedChains.map(a => a + ':' + account),
          methods: DEFAULT_EIP155_METHODS,
          events: requiredNamespaces.eip155?.events
        }
      }

      const existingClientSession = client.session.values.find(s => s.peer.publicKey === params.proposer.publicKey)

      if (!existingClientSession) {
        console.log('WC2 Approving client', namespaces)
        client.approve({
          id,
          relayProtocol: relays[0].protocol,
          namespaces
        }).then(approveResult => {
          console.log('WC2 Approve result', approveResult)
          dispatch({
            type: 'connectedNewSession',
            pairingTopic: params.pairingTopic,
            sessionTopic: approveResult.topic,
            proposerPublicKey: params.proposer.publicKey,
            session: { peerMeta: proposer.metadata },
            namespacedChainIds : usedChains,
            proposal
          })
        }).catch(err => {
          console.error('WC2 Error : ', err.message)
        })
      }
    }
    , [account, addToast])

  const onSessionRequest = useCallback(
    async (requestEvent) => {
      console.log('session_request', requestEvent)
      const { id, topic, params } = requestEvent
      const { request: wcRequest } = params

      console.log('EVENT', 'session_request', requestEvent.request)
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

      //IF HAS TO SIGN
      if (WC2_SUPPORTED_METHODS.includes(wcRequest.method)) {
        console.log('requestEvent.request.method', wcRequest.method)
        console.log(wcRequest)
        let request
        const connection = getConnectionFromSessionTopic(topic)
        if (connection) {
          if (wcRequest.method === 'personal_sign' || wcRequest.method === 'eth_sign') {
            request = {
              id,
              type: wcRequest.method,
              connectionId: connection.pairingTopic,
              txn: wcRequest.params[wcRequest.method === 'personal_sign' ? 0 : 1],
              chainId,
              topic,
              account: wcRequest.params[wcRequest.method === 'personal_sign' ? 1 : 0],
              notification: true
            }
          } else if (wcRequest.method === 'eth_sendTransaction') {
            request = {
              id,
              connectionId: connection.pairingTopic,
              type: wcRequest.method,
              txn: wcRequest.params[0],
              chainId,
              topic,
              account: wcRequest.params[0].from,
              notification: true
            }
          }

          dispatch({
            type: 'requestAdded', request
          })
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
    [addToast]
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

  }, [dispatch, state])

////////////////////////
// SESSION HANDLERS STOP
////////////////////////////////////

//rerun for every state change
  useEffect(() => {
    localStorage[STORAGE_KEY] = JSON.stringify(state)

    if (client) {

      // updating active connections
      client.session.values.forEach(session => {
        console.log('WC2 updating session', session)
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
            console.log('WC2 Updated ' + updateResult)
          }).catch(err => {
            console.log('WC2 Update Error: ' + err.message)
            console.log('WC2 Session trying to update' + session)
          })
        } else {
          //console.log('WC2 : session topic not found in connections ' + session.topic)
        }
      })
    }

  }, [state, account, chainId])

// Initialization effects
  useEffect(() => {

    if (!initialized) {
      onInitialize().then(res => {
        console.log('WC2 Client INITIALIZED')
      }).catch(err => {
        console.log('WC2 Inititialization error')
      })
    }

  }, [connect, account, onInitialize, initialized])

  useEffect(() => {
    if (initialized) {
      client.on('session_proposal', onSessionProposal)
      client.on('session_request', onSessionRequest)
      client.on('session_delete', onSessionDelete)

      // TODOs
      //client.on('session_ping', data => console.log('ping', data))
      //client.on('session_event', data => console.log('event', data))
      //client.on('session_update', data => console.log('update', data))

      const query = new URLSearchParams(window.location.href.split('?').slice(1).join('?'))
      const wcUri = query.get('uri')
      if (wcUri) connect({ uri: wcUri })

      // hax
      window.wc2Connect = uri => connect({ uri })

      // @TODO on focus and on user action
      const clipboardError = e => console.log('non-fatal clipboard/walletconnect err:', e.message)
      const tryReadClipboard = async () => {
        if (!account) return
        if (isFirefox()) return
        try {
          const clipboard = await navigator.clipboard.readText()
          console.log('CLIPBOARD ' + clipboard)
          if (clipboard.match(/wc:[a-f0-9]+@2\?/)) {
            await connect({ uri: clipboard })
          }
        } catch (e) {
          clipboardError(e)
        }
      }

      tryReadClipboard()
      window.addEventListener('focus', tryReadClipboard)

      return () => {
        client.removeListener('session_proposal', onSessionProposal)
        client.removeListener('session_request', onSessionRequest)
        client.removeListener('session_delete', onSessionDelete)

        window.removeEventListener('focus', tryReadClipboard)
      }
    }

  }, [connect, initialized, onSessionProposal, onSessionRequest, onSessionDelete, dispatch, account])

  return {
    connections: state.connections,
    requests: state.requests,
    resolveMany,
    connect, disconnect
  }
}
