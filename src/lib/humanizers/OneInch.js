import { Interface } from 'ethers/lib/utils'
import { nativeToken, token, getName } from 'lib/humanReadableTransactions'

const parseZeroAddressIfNeeded = address => {
    return (address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')
        ? '0x0000000000000000000000000000000000000000'
        : address
}

const toExtended = (
    action,
    word,
    fromToken
) => {
    return [
        [
            action,
            {
                type: 'token',
                ...fromToken,
            },
            word
        ],
    ]
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
        },
        [iface.getSighash('unoswap')]: (txn, network, { dstToken = '', extended = false}) => {
            const { amount, minReturn, srcToken } = iface.parseTransaction(txn).args
            
            const srcToken1 = parseZeroAddressIfNeeded(srcToken)
            const dstToken2 = parseZeroAddressIfNeeded(dstToken)
            const paymentSrcToken = Number(srcToken1) === 0 ? nativeToken(network, amount, extended) : token(humanizerInfo, srcToken1, amount, extended)
            const paymentToken = Number(dstToken2) === 0 ? nativeToken(network, minReturn, extended) : token(humanizerInfo, dstToken2, minReturn, extended)
            
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
        },
    }
  
}

const SwappinMapping = (humanizerInfo) => {
    const SwappinInterface = new Interface(humanizerInfo.abis.SwappinOwn)
    
    return {
        [SwappinInterface.getSighash('payWithEth')]: (txn, network, opts) => {  
            const { amountFrom } = SwappinInterface.parseTransaction(txn).args
            return !opts.extended 
                ? [`Pay with ${nativeToken(network, amountFrom, opts.extended)} for a gift card`]
                : toExtended('Swapping', 'for a gift card on Swappin.gifts', nativeToken(network, amountFrom, opts.extended), {}, {})
        },
        [SwappinInterface.getSighash('payWithUsdToken')]: (txn, network, opts) => {  
            const { amount, token: destToken } = SwappinInterface.parseTransaction(txn).args
            return !opts.extended 
                ? [`Pay with ${token(humanizerInfo, network, destToken, amount)} for a gift card`]
                : toExtended('Swapping', 'for a gift card on Swappin.gifts', token(humanizerInfo, destToken, amount, opts.extended), {}, {})
        },
        [SwappinInterface.getSighash('payWithAnyToken')]: (txn, network, opts) => {  
            const { amountFrom, tokenFrom } = SwappinInterface.parseTransaction(txn).args
            return !opts.extended 
                ? [`Pay with ${token(humanizerInfo, tokenFrom, amountFrom, opts.extended)} for a gift card`]
                : toExtended('Swapping', 'for a gift card on Swappin.gifts', token(humanizerInfo, tokenFrom, amountFrom, opts.extended), {}, {})
        },
    }
}
const mapping = (humanizerInfo) => {
    return { 
        ...OneInchMapping(humanizerInfo), 
        ...SwappinMapping(humanizerInfo)
    }
} 

export default mapping
