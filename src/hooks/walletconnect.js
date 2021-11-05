import { useCallback, useEffect, useReducer, useRef } from 'react'
import { useToasts } from '../hooks/toasts'

import WalletConnectCore from '@walletconnect/core'
import * as cryptoLib from '@walletconnect/iso-crypto'

const noop = () => null
const noopSessionStorage = { setSession: noop, getSession: noop, removeSession: noop }

const STORAGE_KEY = 'wc1_state'
const SUPPORTED_METHODS = ['eth_sendTransaction', 'gs_multi_send', 'personal_sign', 'eth_sign']

const getDefaultState = () => ({ connections: [], requests: [] })

let connectors = {}

export default function useWalletConnect ({ account, chainId, onCallRequest }) {
    const { addToast } = useToasts()

    // This is needed cause of the WalletConnect event handlers
    const stateRef = useRef()
    stateRef.current = { account, chainId }

    const [state, dispatch] = useReducer((state, action) => {
        if (action.type === 'updateConnections') return { ...state, connections: action.connections }
        if (action.type === 'connectedNewSession') {
            return {
                ...state,
                connections: [...state.connections, { uri: action.uri, session: action.session }]
            }
        }
        if (action.type === 'disconnected') {
            return {
                ...state,
                connections: state.connections.filter(x => x.uri !== action.uri)
            }
        }
        if (action.type === 'requestAdded') {
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
        try {
            return {
                ...getDefaultState(),
                ...JSON.parse(localStorage[STORAGE_KEY])
            }
        } catch(e) {
            console.error(e)
            return getDefaultState()
        }
    })

    const connect = useCallback(connectorOpts => {
        if (connectors[connectorOpts.uri]) return connectors[connectorOpts.uri]
        const connector = new WalletConnectCore({
            connectorOpts,
            cryptoLib,
            sessionStorage: noopSessionStorage
        })

        connector.on('session_request', (error, payload) => {
            connector.approveSession({
                accounts: [stateRef.current.account],
                chainId: stateRef.current.chainId,
            })
            // It's safe to read .session right after approveSession because 1) approveSession itself normally stores the session itself
            // 2) connector.session is a getter that re-reads private properties of the connector; those properties are updated immediately at approveSession
            dispatch({ type: 'connectedNewSession', uri: connectorOpts.uri, session: connector.session })

            addToast('Successfully connected to '+connector.session.peerMeta.name)
        })

        connector.on('call_request', async (error, payload) => {
            // @TODO how to handle this err?
            if (error) throw error
            if (!SUPPORTED_METHODS.includes(payload.method)) {
                connector.rejectRequest({ id: payload.id, error: { message: 'METHOD_NOT_SUPPORTED' }})
                return
            }
            // @TODO add more data to this, like connector URI and chainId
            dispatch({ type: 'requestAdded', request: payload })
        })

        connector.on('disconnect', (error, payload) => {
            // @TODO how to handle this err?
            if (error) throw error
            connectors[connectorOpts.uri] = null
            dispatch({ type: 'disconnected', uri: connectorOpts.uri })

            addToast(`${connector.session.peerMeta.name} disconnected: ${payload.params[0].message}`)
        })

        return connector
    }, [])

    const disconnect = useCallback(uri => {
        if (connectors[uri]) {
            connectors[uri].killSession()
            connectors[uri] = null
        }
        dispatch({ type: 'disconnected', uri })
    }, [])

    const resolveMany = (ids, resolution) => {
        // @TODO get the connectors, reply to them
        // then dispatch to remove the requests
    }

    // Side effects that will run on every state change/rerender
    useEffect(() => {
        // restore connectors and update the ones that are stale
        let updateConnections = false
        state.connections.forEach(({ uri, session }) => {
            if (!connectors[uri]) connectors[uri] = connect({ uri, session })
            else {
                const connector = connectors[uri]
                const session = connector.session
                if (session.accounts[0] !== account || session.chainId !== chainId) {
                    connector.updateSession({ accounts: [account], chainId })
                    updateConnections = true
                }
            }
        })
        
        localStorage[STORAGE_KEY] = JSON.stringify(state)

        if (updateConnections) dispatch({
            type: 'updateConnections',
            connections: state.connections.map(({ uri }) => ({ uri, session: connectors[uri].session }))
        })
    }, [state, account, chainId])

    // Initialization effects
    useEffect(() => runInitEffects(connect), [])

    return { connections: state.connections, requests: state.requests, connect, disconnect }
}

// Initialization side effects
// Connect to the URL, read from clipboard, etc.
function runInitEffects(wcConnect) {
    const query = new URLSearchParams(window.location.href.split('?').slice(1).join('?'))
    const wcUri = query.get('uri')
    if (wcUri) wcConnect({ uri: wcUri })

    // hax
    window.wcConnect = uri => wcConnect({ uri })

    // @TODO on focus and on user action
    const clipboardError = e => console.log('non-fatal clipboard err', e)
    var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1
    if (!isFirefox) {
        navigator.permissions.query({ name: 'clipboard-read' }).then((result) => {
            // If permission to read the clipboard is granted or if the user will
            // be prompted to allow it, we proceed.
    
            if (result.state === 'granted' || result.state === 'prompt') {
                navigator.clipboard.readText().then(clipboard => {
                    if (clipboard.startsWith('wc:')) wcConnect({ uri: clipboard })
                }).catch(clipboardError)
            }
            // @TODO show the err to the user if they triggered the action
        }).catch(clipboardError)
    }
}