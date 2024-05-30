export const UNISWAP_PERMIT_EXCEPTIONS = [
  // based on PeerMeta
  // 'Uniswap', // Uniswap Interface - already using UniversalRouter that supports permit form sc wallets, and uniswap interface will not fallback to old routers if we reject the tx
  'Sushi',
  'QuickSwap', // QuickSwap Interface
  'PancakeSwap' // 🥞 PancakeSwap - A next evolution DeFi exchange on BNB Smart Chain (BSC)
]

export const PERMIT_2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3'

export const UNISWAP_UNIVERSAL_ROUTERS = {
  1: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
  11155111: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
  8453: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
  42161: '0x5E325eDA8064b456f4781070C0738d849c824258',
  421614: '0x4A7b5Da61326A6379179b40d00F57E5bbDC962c2',
  10: '0xCb1355ff08Ab38bBCE60111F1bb2B7845384bE25D7e8',
  11155420: '0xD5bBa708b39537d33F2812E5Ea032622456F1A95',
  137: '0xec7BE89e9d109e7e3Fec59c222CF297125FEFda2',
  84532: '0x050E797f3625EC8785265e1d9BDd4799b97528A1',
  56: '0x4Dae2f939ACf50408e13d58534Ff8c2776d45265',
  43114: '0x4Dae2f939ACf50408e13d58534Ff8c2776d45265',
  42220: '0x643770E279d5D0733F21d6DC03A8efbABf3255B4',
  81457: '0x643770E279d5D0733F21d6DC03A8efbABf3255B4'
}

export const DEFAULT_EIP155_EVENTS = ['chainChanged', 'accountsChanged']

export const WC2_SUPPORTED_METHODS = [
  'eth_sendTransaction',
  'personal_sign',
  'eth_signTypedData',
  'eth_sign',
  'eth_sendRawTransaction',
  'eth_signTransaction',
  'eth_signTypedData',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
  'wallet_switchEthereumChain',
  'wallet_addEthereumChain'
]

export const WC1_SUPPORTED_METHODS = [
  'eth_sendTransaction',
  'gs_multi_send',
  'personal_sign',
  'eth_sign',
  'eth_signTypedData_v4',
  'eth_signTypedData',
  'wallet_switchEthereumChain',
  'ambire_sendBatchTransaction',
  'wallet_addEthereumChain'
]

export const DEFAULT_EIP155_METHODS = [
  'eth_sendTransaction',
  'personal_sign',
  'eth_signTypedData',
  'eth_signTransaction',
  'eth_sign'
]
