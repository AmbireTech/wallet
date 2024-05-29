import networks from 'ambire-common/src/constants/networks'

const isRelayerless =
  process.env.REACT_APP_RELAYRLESS === 'true' || !process.env.REACT_APP_RELAYER_URL

/**
 * Maps each network (by its `id`) to a web-specific icon.
 * Note: In case of adding a new network, don't forget to map it's icon here 🤞
 * @enum {string}
 */
export const networkIconsById = {
  ethereum: '/resources/networks/redesign/ethereum.svg',
  'ethereum-pow': '/resources/networks/redesign/ethereum.svg',
  polygon: '/resources/networks/redesign/polygon.svg',
  avalanche: '/resources/networks/redesign/avalanche.svg',
  'binance-smart-chain': '/resources/networks/redesign/bsc.svg',
  fantom: '/resources/networks/redesign/fantom.svg',
  moonbeam: '/resources/networks/redesign/moonbeam.svg',
  moonriver: '/resources/networks/redesign/moonriver.svg',
  arbitrum: '/resources/networks/redesign/arbitrum.svg',
  gnosis: '/resources/networks/redesign/gnosis.svg',
  kucoin: '/resources/networks/redesign/kucoin.svg',
  optimism: '/resources/networks/redesign/optimism.svg',
  base: '/resources/networks/redesign/base.svg',
  scroll: '/resources/networks/redesign/scroll.svg',
  andromeda: '/resources/networks/redesign/metis.svg',
  rinkeby: '/resources/networks/redesign/rinkeby.svg',
  cronos: '/resources/networks/redesign/cronos.png',
  aurora: '/resources/networks/redesign/aurora.svg',
  okc: '/resources/networks/redesign/okc.svg',
  mumbai: '/resources/networks/redesign/polygon.svg',
  sepolia: '/resources/networks/redesign/sepolia.svg'
}
export default networks
  .map((network) => ({ ...network, icon: networkIconsById[network.id] }))
  .filter((network) => isRelayerless || !network.relayerlessOnly)
