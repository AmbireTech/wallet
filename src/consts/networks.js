import networks from 'ambire-common/src/constants/networks'

/**
 * Maps each network (by its `id`) to a web-specific icon.
 * Note: In case of adding a new network, don't forget to map it's icon here 🤞
 * @enum {string}
 */
 export const networkIconsById = {
  ethereum: 'resources/networks/redesign/ethereum.svg',
  polygon: 'resources/networks/redesign/polygon.svg',
  avalanche: 'resources/networks/redesign/avalanche.svg',
  'binance-smart-chain': 'resources/networks/redesign/bsc.svg',
  fantom: 'resources/networks/redesign/fantom.svg',
  moonbeam: 'resources/networks/redesign/moonbeam.svg',
  moonriver: 'resources/networks/redesign/moonriver.svg',
  arbitrum: 'resources/networks/redesign/arbitrum.svg',
  gnosis: 'resources/networks/redesign/gnosis.svg',
  kucoin: 'resources/networks/redesign/kucoin.svg',
  optimism: 'resources/networks/redesign/optimism.svg',
  andromeda: 'resources/networks/redesign/andromeda.svg',
  rinkeby: 'resources/networks/redesign/rinkeby.svg',
  cronos: 'resources/networks/redesign/cronos.png',
  aurora: 'resources/networks/redesign/aurora.svg',
}

// TODO: Upload the new network icons to Production, in order to use them on the Redesign branch (which is still not merged yet)
//  After we upload the missing icons, we can revert the previous logic here.
export default networks.map(network => ({ ...network, icon: `${window.location.origin}${window.location.pathname}${networkIconsById[network.id]}`}))
