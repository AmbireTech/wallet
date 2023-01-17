import networks, { NetworkId, NETWORKS, NetworkType } from 'ambire-common/src/constants/networks'
import { providers } from 'ethers'

export const rpcUrls = {
  // ethereum: 'https://mainnet.infura.io/v3/3d22938fd7dd41b7af4197752f83e8a1',
  // ethereum: 'https://morning-wild-water.quiknode.pro/66011d2c6bdebc583cade5365086c8304c13366c/',
  // ethereum: 'https://mainnet.infura.io/v3/d4319c39c4df452286d8bf6d10de28ae',
  ethereum: 'https://eth-mainnet.alchemyapi.io/v2/SBG22nxioGnHZCCFJ9C93SIN82e9TUHS',
  polygon: 'https://rpc.ankr.com/polygon', // temp - 5M per month and 170k per day
  avalanche: 'https://rpc.ankr.com/avalanche',
  'binance-smart-chain': 'https://bsc-dataseed1.defibit.io',
  fantom: 'https://rpc.ftm.tools',
  moonbeam: 'https://rpc.api.moonbeam.network',
  moonriver: 'https://rpc.api.moonriver.moonbeam.network',
  arbitrum: 'https://arb-mainnet.g.alchemy.com/v2/wBLFG9QR-n45keJvKjc4rrfp2F1sy1Cp',
  // gnosis: 'https://rpc.xdaichain.com',
  gnosis: 'https://rpc.ankr.com/gnosis',
  kucoin: 'https://rpc-mainnet.kcc.network',
  optimism: 'https://mainnet.optimism.io',
  andromeda: 'https://andromeda.metis.io/?owner=1088',
  rinkeby: 'https://rinkeby.infura.io/v3/4409badb714444b299066870e0f7b631',
  cronos: 'https://evm-cronos.crypto.org',
  aurora: 'https://mainnet.aurora.dev',
  'ethereum-pow': 'https://mainnet.ethereumpow.org'
}

// @ts-ignore
const rpcProviders: { [key in NetworkId]: any } = {}

const setProvider = (_id: NetworkId) => {
  // eslint-disable-next-line no-underscore-dangle
  const url = rpcUrls[_id]
  const network = networks.find(({ id }) => id === _id)
  if (!network) return null

  const { id: name, chainId, ensName } = network as NetworkType

  if (url.startsWith('wss:')) {
    return new providers.WebSocketProvider(url, {
      name: ensName || name,
      chainId
    })
  }
  return new providers.StaticJsonRpcProvider(url, {
    name: ensName || name,
    chainId
  })
}

;(Object.keys(NETWORKS) as Array<keyof typeof NETWORKS>).forEach((networkId: NetworkId) => {
  rpcProviders[networkId] = setProvider(networkId)
})

// Case specific RPCs:

const getChainId = (id: NetworkId): number =>  {  
  const chainId = networks.find(x => x.id === id)?.chainId
  if(chainId) {
    return chainId
  }
  throw new Error ('Invalid NetworkId')
}

// @ts-ignore
rpcProviders['ethereum-ambire-earn'] = new providers.StaticJsonRpcProvider('https://eth-mainnet.alchemyapi.io/v2/Qi7xcrPZH22WtSWDSB5KzF1RIFXVP8Oh', {
  name: 'ethereum-ambire-earn',
  chainId: 1
})

// @ts-ignore
rpcProviders['ethereum-ambire-swap'] = new providers.StaticJsonRpcProvider('https://unufri-ethereum.adex.network/v3/099fc58e0de9451d80b18d7c74caa7c1', {
  name: 'ethereum-ambire-swap',
  chainId: getChainId(NETWORKS.ethereum)
})

// @ts-ignore
rpcProviders['polygon-ambire-swap'] = new providers.StaticJsonRpcProvider('https://unufri-polygon.adex.network/v3/099fc58e0de9451d80b18d7c74caa7c1', {
  name: 'polygon-ambire-swap',
  chainId: getChainId(NETWORKS.polygon)
})

// @ts-ignore
rpcProviders['arbitrum-ambire-swap'] = new providers.StaticJsonRpcProvider('https://unufri-arbitrum.adex.network/v3/099fc58e0de9451d80b18d7c74caa7c1', {
  name: 'arbitrum-ambire-swap',
  chainId: getChainId(NETWORKS.arbitrum)
})

// @ts-ignore
rpcProviders['optimism-ambire-swap'] = new providers.StaticJsonRpcProvider('https://unufri-optimism.adex.network/v3/099fc58e0de9451d80b18d7c74caa7c1', {
  name: 'optimism-ambire-swap',
  chainId: getChainId(NETWORKS.optimism)
})

export { rpcProviders }
