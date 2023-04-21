import { useMemo, useEffect, useCallback } from 'react'
import { useToasts } from 'hooks/toasts'
import useWalletConnectV2 from 'hooks/walletConnect/walletConnectV2'
import useWalletConnectLegacy from 'hooks/walletConnect/walletConnectLegacy'
import { isFirefox } from 'lib/isFirefox'

const decodeWalletConnectUri = (uri) => {
  const decodedURI = decodeURIComponent(uri)

  let onlyURI = decodedURI.split('?uri=')[1].split('#')[0]
  
  if (onlyURI.includes('@1')) {
    const bridgeEncoded = onlyURI.substring(onlyURI.indexOf("?bridge=") + 1, onlyURI.lastIndexOf("&"))
    
    const bridge = decodeURIComponent(bridgeEncoded)
    
    onlyURI = onlyURI.replace(bridgeEncoded, bridge)
  }
    
  return onlyURI
}

export default function useWalletConnect({ account, chainId, initialWcURI, allNetworks, setNetwork, useStorage, setRequests }) {

  const { addToast } = useToasts()

  const clipboardError = (e) => console.log('non-fatal clipboard/walletconnect err:', e.message)
  const getClipboardText = useCallback(async () => {
    if (isFirefox()) return false

    try {
      return await navigator.clipboard.readText()
    } catch (e) {
      clipboardError(e)
    }

    return false
  }, [])

  const clearWcClipboard = useCallback(async () => {
    const clipboardText = await getClipboardText()
    if (clipboardText && clipboardText.match(/wc:[a-f0-9-]+@[12]\?/)) {
      navigator.clipboard.writeText('')
    }
  }, [getClipboardText])

  const {
    connections: connectionsLegacy,
    connect: connectLegacy,
    disconnect: disconnectLegacy,
    isConnecting: isConnectingLegacy,
    requests: requestsLegacy,
    resolveMany: resolveManyLegacy
  } = useWalletConnectLegacy({
    account,
    clearWcClipboard,
    getClipboardText,
    chainId,
    allNetworks,
    setNetwork,
    useStorage,
    setRequests
  })

  const {
    connections: connectionsV2,
    connect: connectV2,
    disconnect: disconnectV2,
    isConnecting: isConnectingV2,
    requests: requestsV2,
    resolveMany: resolveManyV2
  } = useWalletConnectV2({
    account,
    clearWcClipboard,
    getClipboardText,
    chainId,
    setRequests
  })

  const requests = useMemo(
    () => [
      ...requestsLegacy.map((r) => {
        return {
          ...r,
          wcVersion: 1
        }
      }),
      ...requestsV2.map((r) => {
        return {
          ...r,
          wcVersion: 2
        }
      })
    ],
    [requestsLegacy, requestsV2]
  )

  const connections = useMemo(
    () => [
      ...connectionsLegacy.map((c) => {
        return {
          ...c,
          wcVersion: 1
        }
      }),
      ...connectionsV2.map((c) => {
        return {
          ...c,
          wcVersion: 2
        }
      })
    ],
    [connectionsLegacy, connectionsV2]
  )

  const resolveMany = (ids, resolution) => {
    resolveManyLegacy(ids, resolution)
    resolveManyV2(ids, resolution)
  }

  const connect = useCallback(
    (connectorOpts) => {
      if (connectorOpts.uri.match(/^wc:([a-f0-9]+)@2/)) {
        connectV2(connectorOpts)
      } else if (connectorOpts.uri.match(/^wc:([a-f0-9-]+)@1/)) {
        connectLegacy(connectorOpts)
      } else {
        addToast('Invalid WalletConnect uri', { error: true })
      }
    },
    [connectV2, connectLegacy, addToast]
  )

  const disconnect = useCallback(
    (connectionId, wcVersion) => {
      if (wcVersion === 2) {
        disconnectV2(connectionId)
      } else if (wcVersion === 1) {
        disconnectLegacy(connectionId)
      }
    },
    [disconnectV2, disconnectLegacy]
  )

  // clipboard stuff
  useEffect(() => {
    if (initialWcURI) {
      if (account) connect({ uri: initialWcURI })
      else
        addToast(
          'WalletConnect dApp connection request detected, please create an account and you will be connected to the dApp.',
          { timeout: 15000 }
        )
    }

    if (typeof window === 'undefined' || !window.location.href.includes('?uri=')) return

    try {
      const wcUri = decodeWalletConnectUri(window.location.href)

      if (!wcUri.includes('key') && !wcUri.includes('symKey')) throw new Error('Wallet Connect URI is missing key')
      
      connect({ uri: wcUri })
    } catch (e) {
      if (e.message) {
        addToast(e.message, { error: true })
        return
      }
      addToast('Invalid WalletConnect uri', { error: true })
    }

  }, [account, initialWcURI, connect, addToast])

  useEffect(() => {
    // hax TODO: ask why? seems working without
    // window.wcConnect = uri => connect({ uri })

    // @TODO on focus and on user action
    const clipboardError = (e) => console.log('non-fatal clipboard/walletconnect err:', e.message)
    const tryReadClipboard = async () => {
      if (!account) return
      if (isFirefox()) return
      if (document.visibilityState !== 'visible') return

      try {
        const clipboard = await navigator.clipboard.readText()
        if (clipboard.match(/wc:[a-f0-9-]+@[12]\?/)) {
          connect({ uri: clipboard })
        }
      } catch (e) {
        clipboardError(e)
      }
    }

    tryReadClipboard()
    document.addEventListener('visibilitychange', tryReadClipboard)

    return () => {
      document.removeEventListener('visibilitychange', tryReadClipboard)
    }
  }, [connect, account, addToast])

  return {
    connections,
    isConnecting: isConnectingLegacy || isConnectingV2,
    requests,
    resolveMany,
    connect,
    disconnect
  }
}
