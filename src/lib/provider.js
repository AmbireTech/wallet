import networks from 'consts/networks'
import { providers } from 'ethers'

export function getProvider (networkId) {
  const network = networks.find(({ id }) => id === networkId)
  if (!network) throw new Error(`getProvider called with non-existent network: ${networkId}`)
  const { id: name, chainId } = network
  const url = network.rpc
  if (url.startsWith('wss:')) return new providers.WebSocketProvider(url, { name, chainId })
  else return new providers.StaticJsonRpcProvider(url, { name, chainId })
}

