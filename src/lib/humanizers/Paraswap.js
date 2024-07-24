import { Interface } from 'ethers/lib/utils'
import { token } from 'lib/humanReadableTransactions'


const parseZeroAddressIfNeeded = (address) => {
    return address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
      ? '0x0000000000000000000000000000000000000000'
      : address
  }

const getSwap = (humanizerInfo, srcToken,fromAmount,destToken,toAmount, extended) => extended ? 
    [
        'Swap', 
        {
            type: 'token',
            ...token(humanizerInfo, parseZeroAddressIfNeeded(srcToken), fromAmount,true)
        },
        'for',
        {
            type: 'token',
            ...token(humanizerInfo, parseZeroAddressIfNeeded(destToken) ,toAmount,true)
        }
    ]:
    `Swap ${token(humanizerInfo,srcToken,fromAmount)} for ${token(humanizerInfo,destToken, toAmount)}`


const ParaswapMapping = (humanizerInfo) => {
  const iface = new Interface(humanizerInfo.abis.ParaswapRouter)
  return {
        [iface.getSighash('swapExactAmountIn')]: (txn, network, { extended }) => {
            const {executor, swapData:{srcToken, destToken,fromAmount,toAmount,quotedAmount,metadata,beneficiary},partnerAndFee,permit,executionData} = iface.parseTransaction(txn).args
            return [getSwap(humanizerInfo,srcToken,fromAmount,destToken,toAmount, extended)]
        },
        [iface.getSighash('swapExactAmountInOnCurveV1')]: (txn, network, { extended }) => {
            const {curveV1Data:{srcToken,destToken,fromAmount,toAmount}} = iface.parseTransaction(txn).args
            return [getSwap(humanizerInfo,srcToken,fromAmount,destToken,toAmount, extended)]
        },
        [iface.getSighash('swapExactAmountInOnCurveV2')]: (txn, network, { extended }) => {
            const {curveV2Data: srcToken,destToken,fromAmount,toAmount}= iface.parseTransaction(txn).args
            return [getSwap(humanizerInfo,srcToken,fromAmount,destToken,toAmount, extended)]
        },
        [iface.getSighash('swapExactAmountInOnUniswapV2')]: (txn, network, { extended }) => {
            const {uniData:{srcToken,destToken,fromAmount,toAmount}}= iface.parseTransaction(txn).args
            return [getSwap(humanizerInfo,srcToken,fromAmount,destToken,toAmount, extended)]
        },
        [iface.getSighash('swapExactAmountInOnUniswapV3')]: (txn, network, { extended }) => {
        const {uniData:{srcToken,destToken, fromAmount, toAmount}} = iface.parseTransaction(txn).args
        return [getSwap(humanizerInfo,srcToken,fromAmount,destToken,toAmount, extended)]
        },
        [iface.getSighash('swapExactAmountOut')]: (txn, network, { extended }) => {
            const {executor, swapData:{srcToken, destToken,fromAmount,toAmount}} = iface.parseTransaction(txn).args
            return [getSwap(humanizerInfo,srcToken,fromAmount,destToken,toAmount, extended)]
        },
        [iface.getSighash('swapExactAmountOutOnUniswapV2')]: (txn, network, { extended }) => {
            const {uniData:{srcToken,destToken,fromAmount,toAmount}}= iface.parseTransaction(txn).args
            return [getSwap(humanizerInfo,srcToken,fromAmount,destToken,toAmount, extended)]
        },
        [iface.getSighash('swapExactAmountOutOnUniswapV3')]: (txn, network, { extended }) => {
        const {uniData:{srcToken,destToken, fromAmount, toAmount}} = iface.parseTransaction(txn).args
        return [getSwap(humanizerInfo,srcToken,fromAmount,destToken,toAmount, extended)]
        }
    }
}
export default ParaswapMapping
