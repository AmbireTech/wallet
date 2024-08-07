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
