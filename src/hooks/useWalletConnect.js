import { useMemo } from 'react'
import { useToasts } from 'hooks/toasts'
import useWalletConnectV2 from 'hooks/walletConnect/walletConnectV2'
import useWalletConnectLegacy from 'hooks/walletConnect/walletConnectLegacy'

export default function useWalletConnect({ account, network, wcUri, allNetworks, setNetwork, useStorage }) {

  const { addToast } = useToasts()

  const {
    connections: connectionsLegacy,
    connect: connectLegacy,
    disconnect: disconnectLegacy,
    isConnecting: isConnectingLegacy,
    requests: requestsLegacy,
    resolveMany: resolveManyLegacy
  } = useWalletConnectLegacy({
    account,
    chainId: network.chainId,
    initialUri: wcUri,
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
    resolveMany: resolveManyV2 } = useWalletConnectV2({
    account,
    chainId: network.chainId
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
  ], [requestsLegacy, requestsV2] )

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

  const connect = (connectorOpts) => {
    if (connectorOpts.uri.match(/^wc:([a-f0-9]+)@2/)) {
      connectV2(connectorOpts)
    } else if (connectorOpts.uri.match(/^wc:([a-f0-9-]+)@1/)) {
      connectLegacy(connectorOpts)
    } else {
      addToast('Invalid WalletConnect uri', {error: true})
    }
  }

  const disconnect = (connectionId, wcVersion) => {
    if (wcVersion === 2) {
      disconnectV2(connectionId)
    } else if (wcVersion === 1) {
      disconnectLegacy(connectionId)
    }
  }

  return {
    connections: connections,
    isConnecting: isConnectingLegacy || isConnectingV2,
    requests: requests,
    resolveMany,
    connect,
    disconnect
  }
}
