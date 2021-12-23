import { abis } from '../../../../consts/humanizerInfo'
import { tokens } from '../../../../consts/humanizerInfo'
import { formatNativeTokenAddress, knownTokens } from '../../../../lib/humanReadableTransactions'
import { Interface } from 'ethers/lib/utils'
import networks from '../../../../consts/networks'

const MovrAnyswapInterface = new Interface(abis.MovrAnyswap)
const MovrRouterInterface = new Interface(abis.MovrRouter)

const getAssetInfo = address => {
    const formattedAddress = formatNativeTokenAddress(address)
    return tokens[formattedAddress] || knownTokens[formattedAddress] || ['Unknown', 0]
}

const getAssetIcon = (address, chainId) => {
    const network = networks.find(n => n.chainId === chainId)
    return network ? `https://storage.googleapis.com/zapper-fi-assets/tokens/${network.id}/${formatNativeTokenAddress(address)}.png` : null
}

const movrTxParser = {
    [MovrAnyswapInterface.getSighash('outboundTransferTo')]: (value, data, currentNetwork) => {
        const { middlewareInputToken, amount, tokenToBridge, toChainId } = MovrAnyswapInterface.parseTransaction({ data, value }).args[0]
        const fromAsset = getAssetInfo(middlewareInputToken)
        const toAsset = getAssetInfo(tokenToBridge)
        const fromAssetIcon = getAssetIcon(middlewareInputToken, currentNetwork.chainId)
        const toAssetIcon = getAssetIcon(tokenToBridge, toChainId.toNumber())

        return {
            from: {
                chainId: currentNetwork.chainId,
                asset: {
                    address: middlewareInputToken,
                    symbol: fromAsset[0],
                    decimals: fromAsset[1],
                    icon: fromAssetIcon
                },
                amount: amount.toString()
            },
            to: {
                chainId: toChainId.toNumber(),
                asset: {
                    address: tokenToBridge,
                    symbol: toAsset[0],
                    decimals: toAsset[1],
                    icon: toAssetIcon
                },
                amount: null
            }
        }
    },
    [MovrRouterInterface.getSighash('outboundTransferTo')]: (value, data, currentNetwork) => {
        const { middlewareRequest, amount, bridgeRequest, toChainId } = MovrRouterInterface.parseTransaction({ data, value }).args[0]
        const { inputToken } = middlewareRequest
        const { inputToken: outputToken } = bridgeRequest
        const fromAsset = getAssetInfo(inputToken)
        const toAsset = getAssetInfo(outputToken)
        const fromAssetIcon = getAssetIcon(inputToken, currentNetwork.chainId)
        const toAssetIcon = getAssetIcon(outputToken, toChainId.toNumber())

        return {
            from: {
                chainId: currentNetwork.chainId,
                asset: {
                    address: inputToken,
                    symbol: fromAsset[0],
                    decimals: fromAsset[1],
                    icon: fromAssetIcon
                },
                amount: amount.toString()
            },
            to: {
                chainId: toChainId.toNumber(),
                asset: {
                    address: outputToken,
                    symbol: toAsset[0],
                    decimals: toAsset[1],
                    icon: toAssetIcon
                },
                amount: null
            }
        }
    }
}

export default movrTxParser