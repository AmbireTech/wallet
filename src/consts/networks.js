import networks from 'ambire-common/src/constants/networks'

const isRelayerless = process.env.REACT_APP_RELAYRLESS === 'true' || !process.env.REACT_APP_RELAYER_URL

/**
 * Maps each network (by its `id`) to a web-specific icon.
 * Note: In case of adding a new network, don't forget to map it's icon here 🤞
 * @enum {string}
 */
 export const networkIconsById = {
  ethereum: '/resources/networks/ethereum.png',
  'ethereum-pow': '/resources/networks/ethereum.png',
  polygon: '/resources/networks/polygon.png',
  avalanche: '/resources/networks/avalanche.png',
  'binance-smart-chain': '/resources/networks/bsc.png',
  fantom: '/resources/networks/fantom.png',
  moonbeam: '/resources/networks/moonbeam.png',
  moonriver: '/resources/networks/moonriver.png',
  arbitrum: '/resources/networks/arbitrum.svg',
  gnosis: '/resources/networks/gnosis.png',
  kucoin: '/resources/networks/kucoin.svg',
  optimism: '/resources/networks/optimism.jpg',
  andromeda: '/resources/networks/andromeda.svg',
  rinkeby: '/resources/networks/rinkeby.png',
  cronos: '/resources/networks/cronos.png',
  aurora: '/resources/networks/aurora.png',
}
export default networks
	.map(network => ({ ...network, icon: networkIconsById[network.id]}))
	.filter(network => isRelayerless || !network.relayerlessOnly)
