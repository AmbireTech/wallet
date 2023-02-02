import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useToasts } from 'hooks/toasts'

import WalletConnectCore from 'walletconnect-legacy-core'
import * as cryptoLib from 'walletconnect-legacy-iso-crypto'

import { UNISWAP_PERMIT_EXCEPTIONS, WC1_SUPPORTED_METHODS } from 'hooks/walletConnect/wcConsts'

const noop = () => null
const noopSessionStorage = { setSession: noop, getSession: noop, removeSession: noop }

const STORAGE_KEY = 'wc1_state'
const SESSION_TIMEOUT = 10000

const getDefaultState = () => ({ connections: [], requests: [] })

let connectors = {}
let connectionErrors = []

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Offline check: if it errored recently
const timePastForConnectionErr = 90 * 1000
const checkIsOffline = connectionId => {
  const errors = connectionErrors.filter(x => x.connectionId === connectionId)
  // if no errors, return false, else check time diff
  return errors.length > 0 && errors.find(({ time } = {}) => time > (Date.now() - timePastForConnectionErr))
}

export default function useWalletConnectLegacy({ account, chainId, clearWcClipboard, allNetworks, setNetwork, useStorage, setRequests }) {
  const { addToast } = useToasts()

  // This is needed cause of the WalletConnect event handlers
  const stateRef = useRef()
  stateRef.current = { account, chainId }

  const [isConnecting, setIsConnecting] = useState(false)

  const [stateStorage, setStateStorage] = useStorage({ key: STORAGE_KEY })

  const [state, dispatch] = useReducer((state, action) => {
    if (action.type === 'updateConnections') return { ...state, connections: action.connections }
    if (action.type === 'connectedNewSession') {
      return {
        ...state,
        connections: [...state.connections, { connectionId: action.connectionId, session: action.session, isOffline: false }]
      }
    }
    if (action.type === 'disconnected') {
      return {
        ...state,
        connections: state.connections.filter(x => x.connectionId !== action.connectionId)
      }
    }
    if (action.type === 'batchRequestsAdded') {
      if (state.requests.find(({ id }) => id === action.batchRequest.id + ':0')) return { ...state }

      const newRequests = []
      for (let ix in action.batchRequest.txns) {
        if (action.batchRequest.txns[ix].to || action.batchRequest.txns[ix].data) {
          newRequests.push({
            ...action.batchRequest,
            type: 'eth_sendTransaction',
            dateAdded: new Date().valueOf(),
            isBatch: true,
            id: action.batchRequest.id + ':' + ix,
            account,
            txn: {
              ...action.batchRequest.txns[ix],
              from: account
            }
          })
        } else {
          return { ...state }
        }
      }

      return { ...state, requests: [...state.requests, ...newRequests] }
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
    if (!stateStorage) return getDefaultState()
    try {
      return {
        ...getDefaultState(),
        ...stateStorage
      }
    } catch (e) {
      console.error(e)
      return getDefaultState()
    }
  })

  // Side effects that will run on every state change/rerender
  const maybeUpdateSessions = () => {
    // restore connectors and update the ones that are stale
    let updateConnections = false
    state.connections.forEach(({ connectionId, isOffline }) => {
      if (connectors[connectionId]) {
        const connector = connectors[connectionId]
        const session = connector.session
        if (session.accounts[0] !== account || session.chainId !== chainId || checkIsOffline(connectionId) !== isOffline) {
          // NOTE: in case isOffline is different, we do not need to do this, but we're gonna leave that just in case the session is outdated anyway
          connector.updateSession({ accounts: [account], chainId })
          updateConnections = true
        }
      }
    })

    setStateStorage(state)
    setRequests(currRe => [...currRe, ...state.requests])

    if (updateConnections) dispatch({
      type: 'updateConnections',
      connections: state.connections
        .filter(({ connectionId }) => connectors[connectionId])
        .map(({ connectionId }) => ({ connectionId, session: connectors[connectionId].session, isOffline: checkIsOffline(connectionId) }))
    })
  }
  useEffect(maybeUpdateSessions, [account, chainId, state, setStateStorage, setRequests])
  // we need this so we can invoke the latest version from any event handler
  stateRef.current.maybeUpdateSessions = maybeUpdateSessions


  // New connections
  const connect = useCallback(async connectorOpts => {

    const connectionIdentifier = connectorOpts.uri

    if (connectors[connectionIdentifier]) {
      addToast('dApp already connected')
      return connectors[connectionIdentifier]
    }
    let connector
    try {
      connector = connectors[connectionIdentifier] = new WalletConnectCore({
        connectorOpts,
        cryptoLib,
        sessionStorage: noopSessionStorage
      })

      if (!connector.connected) {
        await connector.createSession()
      }
    } catch (e) {
      console.error(e)
      addToast(`Unable to connect to ${connectionIdentifier}: ${e.message}`, { error: true })
      return null
    }

    const onError = err => {
      addToast(`WalletConnect error: ${(connector.session && connector.session.peerMeta && connector.session.peerMeta.name)} ${err.message || err}`, { error: true })
      console.error('WC1 error', err)
    }

    let sessionStart
    let sessionTimeout
    if (!connector.session.peerMeta) sessionTimeout = setTimeout(() => {
      const suggestion = /https:\/\/bridge.walletconnect.org/g.test(connector.session.bridge)
        // @TODO: 'or try an alternative connection method' when we implement one
        ? 'this dApp is using an old version of WalletConnect - please tell them to upgrade!'
        : 'perhaps the link has expired? Refresh the dApp and try again.'
      if (!connector.session.peerMeta) addToast(`Unable to get session from dApp - ${suggestion}`, { error: true })
    }, SESSION_TIMEOUT)

    connector.on('session_request', async (error, payload) => {
      if (error) {
        onError(error)
        return
      }

      setIsConnecting(true)

      // Clear the "dApp tool too long to connect" timeout
      clearTimeout(sessionTimeout)

      if (connector.session.peerMeta.url.includes('bridge.avax.network')) {
        const message = 'Avalanche Bridge does not currently support smart wallets.'
        connector.rejectSession({ message })
        addToast(message, { error: true })
        return
      }

      await wait(1000)

      // sessionStart is used to check if dApp disconnected immediately
      sessionStart = Date.now()
      connector.approveSession({
        accounts: [stateRef.current.account],
        chainId: stateRef.current.chainId,
      })

      await wait(1000)

      // On a session request, remove WC uri from the clipboard.
      // Otherwise, in the case the user disconnects himself from the dApp, but still having the previous WC uri in the clipboard,
      // then the app will try to connect him with the already invalidated WC uri.
      clearWcClipboard()

      // We need to make sure that we are connected to the dApp successfully,
      // before keeping the session as connected via `connectedNewSession` dispatch.
      // We had a case with www.chargedefi.fi, where we were immediately disconnected on a session_request,
      // because of unsupported network selected on our end,
      // but still storing the session in the state as a successful connection, which resulted in app crashes.
      if (!connector.connected) {
        setIsConnecting(false)

        return
      }

      // It's safe to read .session right after approveSession because 1) approveSession itself normally stores the session itself
      // 2) connector.session is a getter that re-reads private properties of the connector; those properties are updated immediately at approveSession
      dispatch({
          type: 'connectedNewSession',
          connectionId: connectorOpts.uri,
          //uri: connectionIdentifier,// TODO check if we still need that
          session: connector.session
        }
      )

      addToast('Successfully connected to ' + connector.session.peerMeta.name)

      setIsConnecting(false)
    })

    connector.on('transport_error', (error, payload) => {
      console.error('WC1: transport error', payload)
      connectionErrors.push({ connectionId: connectionIdentifier, event: payload.event, time: Date.now() })
      // Keep the last 690 only
      connectionErrors = connectionErrors.slice(-690)
      stateRef.current.maybeUpdateSessions()
    })

    connector.on('call_request', (error, payload) => {
      if (error) {
        onError(error)
        return
      }

      if (!WC1_SUPPORTED_METHODS.includes(payload.method)) {
        addToast(`dApp requested unsupported method: ${payload.method}`, { error: true })
        connector.rejectRequest({ id: payload.id, error: { message: 'Method not found: ' + payload.method, code: -32601 } })
        return
      }

      const dappName = connector.session?.peerMeta?.name || ''

      // @TODO: refactor into wcRequestHandler
      // Opensea "unlock currency" hack; they use a stupid MetaTransactions system built into WETH on Polygon
      // There's no point of this because the user has to sign it separately as a tx anyway; but more importantly,
      // it breaks Ambire and other smart wallets cause it relies on ecrecover and does not depend on EIP1271
      let txn = payload.params[0]
      if (payload.method === 'eth_signTypedData') {
        // @TODO: try/catch the JSON parse?
        const signPayload = JSON.parse(payload.params[1])
        payload = {
          ...payload,
          method: 'eth_signTypedData',
        }
        txn = signPayload
        if (signPayload.primaryType === 'MetaTransaction') {
          payload = {
            ...payload,
            method: 'eth_sendTransaction',
          }
          txn = [{
            to: signPayload.domain.verifyingContract,
            from: signPayload.message.from,
            data: signPayload.message.functionSignature, // @TODO || data?
            value: signPayload.message.value || '0x0'
          }]
        }
      }
      if (payload.method === 'eth_signTypedData_v4') {
        // @TODO: try/catch the JSON parse?
        const signPayload = JSON.parse(payload.params[1])
        payload = {
          ...payload,
          method: 'eth_signTypedData_v4',
        }
        txn = signPayload
        // Dealing with Erc20 Permits
        if (signPayload.primaryType === 'Permit') {
          // If Uniswap, reject the permit and expect a graceful fallback (receiving approve eth_sendTransaction afterwards)
          if (UNISWAP_PERMIT_EXCEPTIONS.some(ex => dappName.toLowerCase().includes(ex.toLowerCase()))) {
            connector.rejectRequest({ id: payload.id, error: { message: 'Method not found: ' + payload.method, code: -32601 } })
            return
          } else {
            addToast(`dApp tried to sign a token permit which does not support Smart Wallets`, { error: true })
            return
          }
        }
      }
      if (payload.method === 'gs_multi_send' || payload.method === 'ambire_sendBatchTransaction') {
        dispatch({
          type: 'batchRequestsAdded', batchRequest: {
            id: payload.id,
            dateAdded: new Date().valueOf(),
            type: payload.method,
            connectionId: connectionIdentifier,
            txns: payload.params,
            chainId: connector.session?.chainId,
            account: connector.session?.accounts[0],
            notification: true
          }
        })
        return
      }
      //FutureProof? WC does not implement it yet
      if (payload.method === 'wallet_switchEthereumChain') {
        const supportedNetwork = allNetworks.find(a => a.chainId === parseInt(payload.params[0].chainId, 16))

        if (supportedNetwork) {
          setNetwork(supportedNetwork.chainId)
          connector.approveRequest({ id: payload.id, result: { chainId: supportedNetwork.chainId } })
        } else {
          //Graceful error for user
          addToast(`dApp asked to switch to an unsupported chain: ${payload.params[0]?.chainId}`, { error: true })
          connector.rejectRequest({ id: payload.id, error: { message: 'Unsupported chain' } })
        }
      }

      const wrongAcc = (
        payload.method === 'eth_sendTransaction' && payload.params[0] && payload.params[0].from
        && payload.params[0].from.toLowerCase() !== connector.session?.accounts[0].toLowerCase()
      ) || (
        payload.method === 'eth_sign' && payload.params[1]
        && payload.params[1].toLowerCase() !== connector.session?.accounts[0].toLowerCase()
      )
      if (wrongAcc) {
        addToast(`dApp sent a request for the wrong account: ${payload.params[0].from}`, { error: true })
        connector.rejectRequest({ id: payload.id, error: { message: 'Sent a request for the wrong account' } })
        return
      }
      dispatch({
        type: 'requestAdded', request: {
          id: payload.id,
          dateAdded: new Date().valueOf(),
          type: payload.method,
          connectionId: connectionIdentifier,
          txn,
          chainId: connector.session?.chainId,
          account: connector.session?.accounts[0],
          notification: true,
          dapp: connector.session?.peerMeta ? {
            name: connector.session.peerMeta.name,
            description: connector.session.peerMeta.description,
            icons: connector.session.peerMeta.icons,
            url: connector.session.peerMeta.url,
          } : null
        }
      })
    })

    connector.on('disconnect', (error, payload) => {
      if (error) {
        onError(error)
        return
      }

      clearTimeout(sessionTimeout)
      // NOTE the dispatch() will cause double rerender when we trigger a disconnect,
      // cause we will call it once on disconnect() and once when the event arrives
      // we can prevent this by checking if (!connectors[...]) but we'd rather stay safe and ensure
      // the connection is removed
      dispatch({
        type: 'disconnected',
        connectionId: connectionIdentifier,
      })

      connectors[connectionIdentifier] = null

      // NOTE: this event might be invoked 2 times when the dApp itself disconnects
      // currently we don't dedupe that
      if (sessionStart && (Date.now() - sessionStart) < SESSION_TIMEOUT) {
        addToast('dApp disconnected immediately - perhaps it does not support the current network?', { error: true })
      } else {
        addToast(`${connector.session?.peerMeta.name} disconnected: ${payload.params[0].message}`)
      }
    })

    connector.on('error', onError)

    return connector
  }, [addToast, allNetworks, setNetwork, clearWcClipboard])

  const disconnect = useCallback(connectionId => {
    // connector might not be there, either cause we disconnected before,
    // or cause we failed to connect in the first place
    if (connectors[connectionId]) {
      connectors[connectionId].killSession()
      connectors[connectionId] = null
    }
    dispatch({ type: 'disconnected', connectionId })
  }, [])

  const resolveMany = (ids, resolution) => {
    if (ids === undefined) return
    state.requests.forEach(({ id, connectionId, isBatch }) => {
      if (ids.includes(id)) {
        const connector = connectors[connectionId]
        if (!connector) return
        if (!isBatch || id.endsWith(':0')) {
          let realId = isBatch ? id.substr(0, id.lastIndexOf(':')) : id
          if (resolution.success) connector.approveRequest({ id: realId, result: resolution.result })
          else connector.rejectRequest({ id: realId, error: { message: resolution.message } })
        }
      }
    })
    dispatch({ type: 'requestsResolved', ids })
  }

  // Side effects on init
  useEffect(() => {
    state.connections.forEach(({ connectionId, session }) => {
      if (!connectors[connectionId]) connect({ connectionId, session })
    })
    // we specifically want to run this only once despite depending on state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connect])

  return {
    connections: state.connections,
    requests: state.requests,
    resolveMany,
    connect, disconnect, isConnecting
  }
}
