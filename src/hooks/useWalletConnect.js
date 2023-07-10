import { useEffect, useCallback } from 'react'
import { useToasts } from 'hooks/toasts'
import useWalletConnectV2 from 'hooks/walletConnect/walletConnectV2'
import { isFirefox } from 'lib/isFirefox'

const decodeWalletConnectUri = (uri) => {
  const decodedURI = decodeURIComponent(uri)

  let onlyURI = decodedURI.split('?uri=')[1].split('#')[0]

  if (onlyURI.includes('@1')) {
    const bridgeEncoded = onlyURI.substring(
      onlyURI.indexOf('?bridge=') + 1,
      onlyURI.lastIndexOf('&')
    )

    const bridge = decodeURIComponent(bridgeEncoded)

    onlyURI = onlyURI.replace(bridgeEncoded, bridge)
  }

  return onlyURI
}

export default function useWalletConnect({
  account,
  chainId,
  initialWcURI,
  allNetworks,
  setNetwork,
  setRequests
}) {
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
    connections,
    connect: connectV2,
    disconnect,
    isConnecting,
    requests,
    resolveMany
  } = useWalletConnectV2({
    account,
    clearWcClipboard,
    getClipboardText,
    chainId,
    setRequests,
    setNetwork,
    allNetworks
  })

  const connect = useCallback(
    (connectorOpts) => {
      if (connectorOpts.uri.match(/^wc:([a-f0-9]+)@2/)) {
        connectV2(connectorOpts)
      } else if (connectorOpts.uri.match(/^wc:([a-f0-9-]+)@1/)) {
        // @TODO: remove all WC1 related code
        addToast(
          'You are trying to connect to a dApp that uses WC1, which is outdated. Please inform them about this.',
          { error: true }
        )
      } else {
        addToast('Invalid WalletConnect uri', { error: true })
      }
    },
    [connectV2, addToast]
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

      if (!wcUri.includes('key') && !wcUri.includes('symKey'))
        throw new Error('Wallet Connect URI is missing key')

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
        console.log('non-fatal clipboard/walletconnect err:', e.message)
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
    isConnecting,
    requests,
    resolveMany,
    connect,
    disconnect
  }
}
