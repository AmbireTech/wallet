import { useMemo, useEffect, useCallback } from 'react'
import { useToasts } from 'hooks/toasts'
import useWalletConnectV2 from 'hooks/walletConnect/walletConnectV2'
import useWalletConnectLegacy from 'hooks/walletConnect/walletConnectLegacy'
import { isFirefox } from 'lib/isFirefox'

export default function useWalletConnect({ account, chainId, initialWcURI, allNetworks, setNetwork, useStorage }) {

  const { addToast } = useToasts()

  const clipboardError = e => console.log('non-fatal clipboard/walletconnect err:', e.message)
  const getClipboardText = useCallback(async () => {
    if (isFirefox()) return false

    try {
      return await navigator.clipboard.readText()
    } catch(e) { clipboardError(e) }

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
    useStorage
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
  })

  const requests = useMemo(() => [
    ...requestsLegacy.map(r => {
      return {
        ...r,
        wcVersion: 1
      }
    }),
    ...requestsV2.map(r => {
      return {
        ...r,
        wcVersion: 2
      }
    })
  ], [requestsLegacy, requestsV2])

  const connections = useMemo(() => [
    ...connectionsLegacy.map(c => {
      return {
        ...c,
        wcVersion: 1
      }
    }),
    ...connectionsV2.map(c => {
      return {
        ...c,
        wcVersion: 2
      }
    })
  ], [connectionsLegacy, connectionsV2])

  const resolveMany = (ids, resolution) => {
    resolveManyLegacy(ids, resolution)
    resolveManyV2(ids, resolution)
  }

  const connect = useCallback((connectorOpts) => {
    if (connectorOpts.uri.match(/^wc:([a-f0-9]+)@2/)) {
      connectV2(connectorOpts)
    } else if (connectorOpts.uri.match(/^wc:([a-f0-9-]+)@1/)) {
      connectLegacy(connectorOpts)
    } else {
      addToast('Invalid WalletConnect uri', { error: true })
    }
  }, [connectV2, connectLegacy, addToast] )

  const disconnect = useCallback((connectionId, wcVersion) => {
    if (wcVersion === 2) {
      disconnectV2(connectionId)
    } else if (wcVersion === 1) {
      disconnectLegacy(connectionId)
    }
  }, [disconnectV2, disconnectLegacy])


  // clipboard stuff
  useEffect(() => {
    if (initialWcURI) {
      if (account) connect({ uri: initialWcURI })
      else addToast('WalletConnect dApp connection request detected, please create an account and you will be connected to the dApp.', { timeout: 15000 })
    }
    const query = new URLSearchParams(window.location.href.split('?').slice(1).join('?'))
    const wcUri = query.get('uri')
    if (wcUri) connect({ uri: wcUri })

    // hax TODO: ask why? seems working without
    // window.wcConnect = uri => connect({ uri })

    // @TODO on focus and on user action
    const clipboardError = e => console.log('non-fatal clipboard/walletconnect err:', e.message)
    const tryReadClipboard = async () => {
      if (!account) return
      if (isFirefox()) return
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
    window.addEventListener('focus', tryReadClipboard)

    return () => {
      window.removeEventListener('focus', tryReadClipboard)
    }
  }, [connect, account, addToast, initialWcURI])

  return {
    connections: connections,
    isConnecting: isConnectingLegacy || isConnectingV2,
    requests: requests,
    resolveMany,
    connect,
    disconnect
  }
}
