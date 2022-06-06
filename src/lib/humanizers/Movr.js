import { abis } from 'consts/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
import { formatNativeTokenAddress, token } from 'lib/humanReadableTransactions'
import networks from 'consts/networks'

const MovrAnyswapInterface = new Interface(abis.MovrAnyswap)
const MovrRouterInterface = new Interface(abis.MovrRouter)

const getNetwork = (chainId, extended = false) => {
  const network = networks.find(n => n.chainId === Number(chainId))
  return !extended ? network.name : network
}

const toExtended = (fromToken, network, toToken) => {
  return [[
    'Transfer',
    {
      type: 'token',
      ...fromToken
    },
    'to',
    {
      type: 'network',
      ...network
    },
    'for',
    {
      type: 'token',
      ...toToken
    }
  ]]
}

const MovrMapping = {
  [MovrAnyswapInterface.getSighash('outboundTransferTo')]: (txn, network, { extended = false }) => {
    const { middlewareInputToken, amount, tokenToBridge, toChainId } = MovrAnyswapInterface.parseTransaction(txn).args[0]
    return !extended ?
      [`Transfer ${token(middlewareInputToken, amount)} to ${getNetwork(toChainId)} for ${token(tokenToBridge)}`]
      : toExtended(token(middlewareInputToken, amount, true), getNetwork(toChainId, true), token(tokenToBridge, null, true))
  },
  [MovrRouterInterface.getSighash('outboundTransferTo')]: (txn, network, { extended = false }) => {
    const { middlewareRequest, amount, bridgeRequest, toChainId } = MovrRouterInterface.parseTransaction(txn).args[0]
    const { inputToken } = middlewareRequest
    const { inputToken: outputToken } = bridgeRequest
    return !extended ?
      [`Transfer ${token(formatNativeTokenAddress(inputToken), amount)} to ${getNetwork(toChainId)} for ${token(formatNativeTokenAddress(outputToken))}`]
      : toExtended(token(formatNativeTokenAddress(inputToken), amount, true), getNetwork(toChainId, true), token(formatNativeTokenAddress(outputToken), null, true))
  },
}
export default MovrMapping