import networks from 'ambire-common/src/constants/networks'
import { providers } from 'ethers'

// Cache provider instances by a network id
// For instance: { 'ethereum': new providers.StaticJsonRpcProvider }
const providersByNetwork = {}

export function getProvider (networkId) {
  const network = networks.find(({ id }) => id === networkId)
  if (!network) throw new Error(`getProvider called with non-existent network: ${networkId}`)

  // If the provider instance is already created, just reuse the cached instance,
  // instead of creating the same object again.
  if (providersByNetwork[networkId]) return providersByNetwork[networkId]

  const { id: name, chainId } = network
  const url = network.rpc

  if (url.startsWith('wss:')) {
    providersByNetwork[networkId] = new providers.WebSocketProvider(url, { name, chainId })
  }
  else {
    providersByNetwork[networkId] = new providers.StaticJsonRpcProvider(url, { name, chainId })
  }

  return providersByNetwork[networkId]
}

