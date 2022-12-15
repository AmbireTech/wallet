import { Interface } from 'ethers/lib/utils'
import { nativeToken, token } from 'lib/humanReadableTransactions'

const parseZeroAddressIfNeeded = address => {
    return (address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')
        ? '0x0000000000000000000000000000000000000000'
        : address
}

const OneInchMapping = (humanizerInfo) => {
    const iface = new Interface(humanizerInfo.abis.Swappin)

    return {
        [iface.getSighash('swap')]: (txn, network, { extended = false }) => {
            const { desc } = iface.parseTransaction(txn).args
            const srcToken = parseZeroAddressIfNeeded(desc.srcToken)
            const dstToken = parseZeroAddressIfNeeded(desc.dstToken)
            const paymentSrcToken = Number(srcToken) === 0 ? nativeToken(network, desc.amount, extended) : token(humanizerInfo, srcToken, desc.amount, extended)
            const paymentToken = Number(dstToken) === 0 ? nativeToken(network, desc.minReturnAmount, extended) : token(humanizerInfo, dstToken, desc.minReturnAmount, extended)
            
            return !extended
                ? [`Swap ${paymentSrcToken} for at least ${paymentToken} on 1inch`]
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
                    'on 1inch'
                    ]
                ]
            }
    }
  
}

export default OneInchMapping
