import networks from 'consts/networks'

export const getNetworkByChainId = (chainId) => {
  return networks.find(n => n.chainId === chainId)
}

export const getNetworkById = (id) => {
  return networks.find(n => n.id === id)
}
