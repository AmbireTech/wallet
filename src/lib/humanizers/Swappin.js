import { Interface } from 'ethers/lib/utils'
import { nativeToken, token } from 'lib/humanReadableTransactions'


const SwappinMapping = (humanizerInfo) => {
    const swappin = new Interface(humanizerInfo.abis.Swappin)

    return {
        [swappin.getSighash('swap')]: (txn, network, { extended = false }) => {
            const { desc } = swappin.parseTransaction(txn).args
            const paymentSrcToken = Number(desc.srcToken) === 0 ? nativeToken(network, desc.amount, extended) : token(humanizerInfo, desc.srcToken, parseFloat(desc.amount), extended)
            const paymentToken = Number(desc.dstToken) === 0 ? nativeToken(network, desc.minReturnAmount, extended) : token(humanizerInfo, desc.dstToken, parseFloat(desc.minReturnAmount), extended)
            
            return !extended
                ? [`Swap ${paymentSrcToken} for at least ${paymentToken} on Swappin`]
                : [
                    [
                    'Swap',
                    {
                        type: 'token',
                        ...paymentSrcToken
                    },
                    'for at least',
                    {
                        type: 'token',
                        ...paymentToken
                    },
                    'on Swappin'
                    ]
                ]
            }
    }
  
}

export default SwappinMapping