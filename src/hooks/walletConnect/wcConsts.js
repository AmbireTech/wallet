export const UNISWAP_PERMIT_EXCEPTIONS = [ // based on PeerMeta
  // 'Uniswap', // Uniswap Interface - already using UniversalRouter that supports permit form sc wallets, and uniswap interface will not fallback to old routers if we reject the tx
  'Sushi',
  'QuickSwap', // QuickSwap Interface
  'PancakeSwap', // 🥞 PancakeSwap - A next evolution DeFi exchange on BNB Smart Chain (BSC)
]

export const DEFAULT_EIP155_METHODS = [
  'eth_sendTransaction',
  'personal_sign',
  'eth_signTypedData',
  'eth_signTransaction',
  'eth_sign'
]

export const DEFAULT_EIP155_EVENTS = [
  'chainChanged',
  'accountsChanged',
]

export const WC2_SUPPORTED_METHODS = [
  'eth_sendTransaction',
  'personal_sign',
  'eth_signTypedData',
  'eth_sign'
]

export const WC1_SUPPORTED_METHODS = [
  'eth_sendTransaction',
  'gs_multi_send',
  'personal_sign',
  'eth_sign',
  'eth_signTypedData_v4',
  'eth_signTypedData',
  'wallet_switchEthereumChain',
  'ambire_sendBatchTransaction'
]
