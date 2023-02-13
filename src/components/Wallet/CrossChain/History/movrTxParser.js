import { formatNativeTokenAddress, knownTokens } from 'lib/humanReadableTransactions'
import { Interface } from 'ethers/lib/utils'
import networks from 'consts/networks'
import { getTokenIcon } from 'lib/icons'

const getAssetInfo = (tokens, address) => {
    const formattedAddress = formatNativeTokenAddress(address)
    return tokens[formattedAddress] || knownTokens[formattedAddress] || ['Unknown', 0]
}

const getAssetIcon = (address, chainId) => {
    const network = networks.find(n => n.chainId === chainId)
    return network ? getTokenIcon(network.id, formatNativeTokenAddress(address)) : null
}

const formatTx = (tokens, fromChainId, toChainId, inputToken, outputToken, amount) => {
    const fromAsset = getAssetInfo(tokens, inputToken)
    const toAsset = getAssetInfo(tokens, outputToken)
    const fromAssetIcon = getAssetIcon(inputToken, fromChainId)
    const toAssetIcon = getAssetIcon(outputToken, fromChainId)

    return {
        from: {
            chainId: fromChainId,
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

const movrTxParser = (humanizerInfo) => {
    const { tokens, abis } = humanizerInfo

    const MovrAnyswapInterface = new Interface(abis.MovrAnyswap)
    const MovrRouterInterface = new Interface(abis.MovrRouter)
    return {
        [MovrAnyswapInterface.getSighash('outboundTransferTo')]: (value, data, currentNetwork) => {
            const { middlewareInputToken, amount, tokenToBridge, toChainId } = MovrAnyswapInterface.parseTransaction({ data, value }).args[0]
            return formatTx(tokens, currentNetwork.chainId, toChainId, middlewareInputToken, tokenToBridge, amount)
        },
        [MovrRouterInterface.getSighash('outboundTransferTo')]: (value, data, currentNetwork) => {
            const { middlewareRequest, amount, bridgeRequest, toChainId } = MovrRouterInterface.parseTransaction({ data, value }).args[0]
            const { inputToken } = middlewareRequest
            const { inputToken: outputToken } = bridgeRequest
            return formatTx(tokens, currentNetwork.chainId, toChainId, inputToken, outputToken, amount)
        }
    }
}

export default movrTxParser