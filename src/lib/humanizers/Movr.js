import { abis } from 'consts/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
import { formatNativeTokenAddress, token } from 'lib/humanReadableTransactions'
import networks from 'consts/networks'

const MovrAnyswapInterface = new Interface(abis.MovrAnyswap)
const MovrRouterInterface = new Interface(abis.MovrRouter)

const getNetwork = chainId => networks.find(n => n.chainId === Number(chainId)).name

const MovrMapping = {
  [MovrAnyswapInterface.getSighash('outboundTransferTo')]: (txn, network) => {
    const { middlewareInputToken, amount, tokenToBridge, toChainId } = MovrAnyswapInterface.parseTransaction(txn).args[0]
    return [`Transfer ${token(middlewareInputToken, amount)} to ${getNetwork(toChainId)} for ${token(tokenToBridge)}`]
  },
  [MovrRouterInterface.getSighash('outboundTransferTo')]: (txn, network) => {
    const { middlewareRequest, amount, bridgeRequest, toChainId } = MovrRouterInterface.parseTransaction(txn).args[0]
    const { inputToken } = middlewareRequest
    const { inputToken: outputToken } = bridgeRequest
    return [`Transfer ${token(formatNativeTokenAddress(inputToken), amount)} to ${getNetwork(toChainId)} for ${token(formatNativeTokenAddress(outputToken))}`]
  },
}
export default MovrMapping