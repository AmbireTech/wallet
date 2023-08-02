import { Interface } from 'ethers/lib/utils'
import { formatNativeTokenAddress, token, nativeToken } from 'lib/humanReadableTransactions'
import networks from 'consts/networks'

const getNetwork = (chainId, extended = false) => {
  const network = networks.find((n) => n.chainId === Number(chainId))
  return !extended ? network.name : network
}

const toExtended = (fromToken, network, toToken) => {
  return [
    [
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
    ]
  ]
}

const ZERO_ADDRESS = `0x${'0'.repeat(40)}`
const getTokenDetails = (humInfo, network, tokenAddress, amount, extended = false) =>
  tokenAddress === ZERO_ADDRESS
    ? nativeToken(network, amount, extended)
    : token(humInfo, tokenAddress, amount, extended)

const MovrMapping = (humanizerInfo) => {
  const MovrAnyswapInterface = new Interface(humanizerInfo.abis.MovrAnyswap)
  const MovrRouterInterface = new Interface(humanizerInfo.abis.MovrRouter)

  return {
    [MovrAnyswapInterface.getSighash('outboundTransferTo')]: (
      txn,
      network,
      { extended = false }
    ) => {
      const { middlewareInputToken, amount, tokenToBridge, toChainId } =
        MovrAnyswapInterface.parseTransaction(txn).args[0]
      return !extended
        ? [
            `Transfer ${token(humanizerInfo, middlewareInputToken, amount)} to ${getNetwork(
              toChainId
            )} for ${token(humanizerInfo, tokenToBridge, null)}`
          ]
        : toExtended(
            token(humanizerInfo, middlewareInputToken, amount, true),
            getNetwork(toChainId, true),
            token(humanizerInfo, tokenToBridge, null, true)
          )
    },
    [MovrRouterInterface.getSighash('outboundTransferTo')]: (
      txn,
      network,
      { extended = false }
    ) => {
      const { middlewareRequest, amount, bridgeRequest, toChainId } =
        MovrRouterInterface.parseTransaction(txn).args[0]
      const { inputToken } = middlewareRequest
      const { inputToken: outputToken } = bridgeRequest
      return !extended
        ? [
            `Transfer ${getTokenDetails(
              humanizerInfo,
              network,
              formatNativeTokenAddress(inputToken),
              amount
            )} to ${getNetwork(toChainId)} for ${getTokenDetails(
              humanizerInfo,
              network,
              formatNativeTokenAddress(outputToken),
              null
            )}`
          ]
        : toExtended(
            getTokenDetails(
              humanizerInfo,
              network,
              formatNativeTokenAddress(inputToken),
              amount,
              true
            ),
            getNetwork(toChainId, true),
            getTokenDetails(
              humanizerInfo,
              network,
              formatNativeTokenAddress(outputToken),
              null,
              true
            )
          )
    }
  }
}
export default MovrMapping
