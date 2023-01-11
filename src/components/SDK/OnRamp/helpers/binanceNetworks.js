import { NETWORKS as enumNETWORKS } from 'ambire-common/src/constants/networks'

const binanceNetworks = {
  [enumNETWORKS.ethereum]: 'ETH',
  [enumNETWORKS.polygon]: 'MATIC',
  [enumNETWORKS['binance-smart-chain']]: 'BSC',
  [enumNETWORKS.avalanche]: 'AVAXC',
  [enumNETWORKS.moonriver]: 'MOVR',
  [enumNETWORKS.moonbeam]: 'GLMR',
  [enumNETWORKS.fantom]: 'FTM',
  [enumNETWORKS.arbitrum]: 'ARBITRUM',
  [enumNETWORKS.optimism]: 'OPTIMISM',
}

export default binanceNetworks
