import networks from 'ambire-common/src/constants/networks'

/**
 * Maps each network (by its `id`) to a web-specific icon.
 * Note: In case of adding a new network, don't forget to map it's icon here 🤞
 * @enum {string}
 */
 export const networkIconsById = {
  ethereum: '/resources/networks/ethereum.svg',
  polygon: '/resources/networks/polygon.svg',
  avalanche: '/resources/networks/avalanche.svg',
  'binance-smart-chain': '/resources/networks/bsc.svg',
  fantom: '/resources/networks/fantom.svg',
  moonbeam: '/resources/networks/moonbeam.svg',
  moonriver: '/resources/networks/moonriver.svg',
  arbitrum: '/resources/networks/arbitrum.svg',
  gnosis: '/resources/networks/gnosis.svg',
  kucoin: '/resources/networks/kucoin.svg',
  optimism: '/resources/networks/optimism.svg',
  andromeda: '/resources/networks/andromeda.svg',
  rinkeby: '/resources/networks/rinkeby.svg',
  cronos: '/resources/networks/cronos.png',
  aurora: '/resources/networks/aurora.svg',
}

export default networks.map(network => ({ ...network, icon: networkIconsById[network.id]}))
