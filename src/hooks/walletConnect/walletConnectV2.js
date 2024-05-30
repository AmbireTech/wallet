/* eslint-disable no-console */
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useToasts } from 'hooks/toasts'

import { Core } from '@walletconnect/core'
import { getSdkError } from '@walletconnect/utils'
import { Web3Wallet } from '@walletconnect/web3wallet'
import { formatJsonRpcError, formatJsonRpcResult } from '@json-rpc-tools/utils'

import {
  UNISWAP_PERMIT_EXCEPTIONS,
  DEFAULT_EIP155_EVENTS,
  WC2_SUPPORTED_METHODS,
  PERMIT_2_ADDRESS,
  UNISWAP_UNIVERSAL_ROUTERS
} from 'hooks/walletConnect/wcConsts'
import networks from 'consts/networks'
import { ethers } from 'ethers'

const STORAGE_KEY = 'wc2_requests'

const WC2_VERBOSE = process.env.REACT_APP_WC2_VERBOSE || 0

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
  setRequests: setWalletRequests,
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

  const [requests, dispatch] = useReducer(
    (prevRequests, action) => {
      if (action.type === 'requestAdded') {
        if (prevRequests.find(({ id }) => id === action.id)) return prevRequests
        return [...prevRequests, action.request]
      }
      if (action.type === 'requestsResolved') {
        return prevRequests.filter((x) => !action.ids.includes(x.id))
      }
      return prevRequests
    },
    null,
    () => {
      const rawRequests = localStorage[STORAGE_KEY]

      if (!rawRequests) return []

      const parsedRequests = JSON.parse(rawRequests) || []

      return parsedRequests
    }
  )

  const getConnectionFromSessionTopic = useCallback(
    (topic) => {
      const connections = Object.values(web3wallet.getActiveSessions() || {})
      return connections.find((c) => c.topic === topic || c.pairingTopic === topic)
    },
    [web3wallet]
  )

  const connect = useCallback(
    async (connectorOpts, isFromUrl) => {
      if (!web3wallet) {
        if (WC2_VERBOSE) console.log('WC2: Web3Wallet not initialized')
        return
      }

      try {
        const res = await web3wallet.core.pairing.pair({ uri: connectorOpts.uri })

        // We show the toast only if the user has connected from a
        // url parameter, because then he can't see the connections changing
        // when the WalletConnect dropdown is closed.
        if (isFromUrl) {
          addToast('WalletConnect connection successful.')
          // We want to remove the uri parameter from the url without refreshing the page.
          // We remove the parameter to prevent additional connection attempts.
          window.history.replaceState(null, '', `${window.location.pathname}#/wallet/dashboard`)
        }

        if (WC2_VERBOSE) console.log('pairing result', res)
      } catch (e) {
        console.log('WC2: Pairing error (code)', e)

        const topic = connectorOpts.uri.match(/:.+@/)[0].replace(/[:@]/g, '')
        const activeSession = getConnectionFromSessionTopic(topic)

        if (e.toString().includes('Pairing already exists')) {
          // The user has disconnected from the dApp and then tries to connect to the same URI, which
          // is now expired.
          if (!activeSession && !isFromUrl) {
            addToast('This URI has expired, please get a new one from the dApp.', { error: true })
            return
          }
          if (!activeSession && isFromUrl) {
            addToast(
              'Your WalletConnect Web connection has expired. Please connect to the dApp again with a new uri.',
              { error: true }
            )
            // We want to remove the uri parameter from the url without refreshing the page.
            // We remove the parameter to prevent additional connection attempts.
            window.history.replaceState(null, '', `${window.location.pathname}#/wallet/dashboard`)
          }
          // If we got the WC URI from the uri param we don't want to show an error toast,
          // because the param is still the same and there will be an error when trying to connect.
          if (isFromUrl) {
            window.history.replaceState(null, '', `${window.location.pathname}#/wallet/dashboard`)
            return
          }

          addToast(e.message, { error: true })
        }

        addToast(e.message, { error: true })
      } finally {
        setIsConnecting(false)
      }
    },
    [web3wallet, addToast, getConnectionFromSessionTopic]
  )

  const disconnect = useCallback(
    async (topic) => {
      if (!topic) return

      setIsConnecting(true)
      // connector might not be there, either cause we disconnected before,
      // or cause we failed to connect in the first place
      if (!web3wallet) {
        if (WC2_VERBOSE) console.log('WC2 disconnect: Web3Wallet not initialized')
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
        } catch (e) {
          // Should happen in extremely rare cases in which the user's
          // storage is corrupted and the keychain is not found.
          if (e?.message?.includes('No matching key. keychain')) {
            try {
              await web3wallet.engine.signClient.session.delete(topic, 'USER_DISCONNECTED')
            } catch {
              addToast(
                'Could not disconnect from the dApp. Please contact support if the issue persists.',
                {
                  error: true
                }
              )
              console.log('WC2 disconnect error', e)
            }
          } else {
            console.log('WC2 disconnect error', e)
          }
        }
      }
      setIsConnecting(false)
    },
    [web3wallet, addToast]
  )

  const resolveMany = (ids, resolution) => {
    requests.forEach(({ id, topic }) => {
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
      const { relays, optionalNamespaces, requiredNamespaces } = params

      setIsConnecting(true)
      const supportedChains = []

      networks.forEach((n) => {
        if (!supportedChains.includes(n.chainId)) {
          supportedChains.push(`eip155:${n.chainId}`)
        }
      })

      const incomingEvents = [
        ...new Set([
          ...(optionalNamespaces?.eip155?.events || []),
          ...(requiredNamespaces?.eip155?.events || [])
        ])
      ]

      const incomingMethods = [
        ...new Set([
          // Filter out unsupported optional methods. Note: Can't be done for required methods.
          ...(optionalNamespaces?.eip155?.methods || []).filter((method) =>
            WC2_SUPPORTED_METHODS.includes(method)
          ),
          ...(requiredNamespaces?.eip155?.methods || [])
        ])
      ]

      const namespaces = {
        eip155: {
          chains: supportedChains,
          accounts: supportedChains.map((a) => `${a}:${account}`),
          methods: incomingMethods,
          events: incomingEvents
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
          .catch((error) => {
            addToast(error.message, { error: true })
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
          const dappName = connection.peer?.metadata.name || ''

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
            const isSnapshot = (_dappName, _txn) => _dappName && _dappName.toLowerCase().includes('snapshot') && _txn.domain && _txn.domain.name === 'snapshot'
            const isOkPermit2 = (_txn) =>
              _txn.primaryType &&
              _txn.primaryType.toLowerCase().includes('permit') &&
              _txn.message && _txn.message.spender &&
              _txn.message.spender.toLowerCase() === UNISWAP_UNIVERSAL_ROUTERS[requestChainId].toLowerCase() &&
              _txn.domain && _txn.domain.verifyingContract &&
              _txn.domain.verifyingContract.toLowerCase() === PERMIT_2_ADDRESS.toLowerCase()

            if (!isSnapshot(dappName, txn) && !isOkPermit2(txn)) {
              const response = formatJsonRpcError(id, {
                message: `Signing this eip-712 message is disallowed as it does not contain the smart account address and therefore deemed unsafe: ${method}`,
                code: -32003
              })
              web3wallet
                .respondSessionRequest({ topic, response })
                .catch((err) => {
                  addToast(err.message, { error: true })
                })
              addToast(
                'The typed message from this dapp is deemed unsafe as it is vulnerable to replay attacks.',
                { warning: true }
              )
              return
            }

          } else if (
            method === 'wallet_switchEthereumChain' ||
            method === 'wallet_addEthereumChain'
          ) {
            const { chainId: incomingChainId } = wcRequest.params[0] || {}

            if (!incomingChainId) {
              addToast('dApp tried to switch to an invalid network.', { error: true })
              web3wallet.respondSessionRequest({
                topic,
                response: formatJsonRpcError(id, {
                  message: `Invalid Network ${incomingChainId}`,
                  code: -32602
                })
              })
              return
            }

            const incomingChainIdNum = parseInt(incomingChainId, 16)

            if (!networks.find((n) => n.chainId === incomingChainIdNum)) {
              addToast(
                `dApp tried to switch to an unsupported network (chainId: ${incomingChainIdNum}).`,
                { error: true }
              )
              web3wallet.respondSessionRequest({
                topic,
                response: formatJsonRpcError(id, {
                  message: `Unsupported chain id ${incomingChainIdNum}`,
                  code: -32602
                })
              })
              return
            }

            setNetwork(incomingChainIdNum)
          }

          if (txn && ethers.utils.isAddress(requestAccount)) {
            const request = {
              id,
              type: method,
              dateAdded: new Date().valueOf(),
              txn,
              chainId: requestChainId,
              topic,
              account: ethers.utils.getAddress(requestAccount),
              notification: true,
              dapp: connection.peer.metadata
                ? {
                  name: connection.peer.metadata.name,
                  description: connection.peer.metadata.description,
                  icons: connection.peer.metadata.icons,
                  url: connection.peer.metadata.url
                }
                : null
            }
            setWalletRequests((prev) => [...prev, request])
            if (WC2_VERBOSE) console.log('WC2 request added :', request)
            dispatch({
              type: 'requestAdded',
              request
            })
          }
        } else {
          addToast('Request error. Please reconnect the dApp and try again.', { error: true })
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
      setWalletRequests,
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
      if (WC2_VERBOSE) console.log('WC2 session_delete', deletion)

      addToast('WalletConnect session ended from the dApp.')

      setIsConnecting(false)
    },
    [addToast]
  )

  /// /////////////////////
  // SESSION HANDLERS STOP
  /// /////////////////////////////////

  // rerun for every state change
  useEffect(() => {
    localStorage[STORAGE_KEY] = JSON.stringify(requests)

    if (web3wallet) {
      // updating active connections
      const sessions = web3wallet.getActiveSessions()

      if (!sessions || (sessions && Object.keys(sessions).length === 0)) return

      Object.keys(sessions).map(async (topic) => {
        const session = sessions[topic]

        if (WC2_VERBOSE) console.log('WC2 updating session', session)
        if (session) {
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
  }, [web3wallet, account, chainId, requests])

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
    onSessionEvent,
    account
  ])

  return {
    connections: web3wallet ? Object.values(web3wallet?.getActiveSessions() || {}) : [],
    requests,
    isConnecting,
    resolveMany,
    connect,
    disconnect
  }
}
