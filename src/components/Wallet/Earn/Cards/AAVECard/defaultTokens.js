import { getTokenIcon } from 'lib/icons'
import v2Tokens from './v2Tokens'

const tokens = {
  ethereum: v2Tokens.ethereum,
  polygon: v2Tokens.polygon,
  avalanche: v2Tokens.avalanche,
  'binance-smart-chain': []
}

const getDefaultTokensItems = (network) => {
  if (!tokens[network]) return []
  return [
    ...(tokens[network].map((t) => ({
      address: t.baseTokenAddress,
      baseTokenAddress: t.baseTokenAddress,
      symbol: t.baseTokenSymbol,
      name: t.baseTokenSymbol,
      img: getTokenIcon(network, t.baseTokenAddress),
      balance: 0,
      balanceRaw: '0',
      type: 'deposit'
    })) || []),
    ...(tokens[network].map((t) => ({
      address: t.address,
      baseTokenAddress: t.baseTokenAddress,
      symbol: t.symbol,
      name: t.symbol,
      img: getTokenIcon(network, t.baseTokenAddress),
      balance: 0,
      balanceRaw: '0',
      type: 'withdraw'
    })) || [])
  ]
}

export { getDefaultTokensItems }
