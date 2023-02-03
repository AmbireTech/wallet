import { Interface } from 'ethers/lib/utils'
import { nativeToken, token, getName } from 'lib/humanReadableTransactions'

const parseZeroAddressIfNeeded = address => {
    return (address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')
        ? '0x0000000000000000000000000000000000000000'
        : address
}

const recipientText = (humanizerInfo, recipient, txnFrom, extended = false) =>
    recipient.toLowerCase() === txnFrom.toLowerCase()
        ? !extended
            ? ``
            : []
        : extended
        ? `${recipient}`
        : [
              '',
              {
                  type: 'address',
                  address: recipient,
                  name: getName(humanizerInfo, recipient),
              },
          ]

const toExtended = (
    action,
    word,
    fromToken,
    toToken,
    recipient = ['on Swappin'],
    expires = []
) => {
    return [
        [
            action,
            {
                type: 'token',
                ...fromToken,
            },
            word,
            {
                type: 'token',
                ...toToken,
            },
            ...recipient,
            expires,
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
        [SwappinInterface.getSighash('payWithEth')]: (txn, network, { extended = false }) => {
            // Props
            // amountForm - Swappin
            // OneInch Contract data:
            // swapProvider (address) - OneInch contract address
            // swapCalldata (bytes) - calldata to pass arguments to the swap provider
            // dest (address) - destination wallet (must be whitelisted)
            // token (address) - destination token (i.e. USDC - must be whitelisted)
        const { amountFrom, swapCalldata, dest, token: tokenDst } = SwappinInterface.parseTransaction(txn).args
        const mappingResult = OneInchMapping(humanizerInfo)
        const sigHash = swapCalldata.slice(0, 10)
        const humanizer = mappingResult[sigHash]
        const swapCall =  humanizer ? humanizer({ ...txn, data: swapCalldata }, network, { dstToken: tokenDst }) : null
        
        const parsed = !extended ?
            [`Pay with ${nativeToken(network, amountFrom, extended)} to ${recipientText(humanizerInfo, dest, txn.from)}`]
            : toExtended('Pay with', 'to', nativeToken(network, amountFrom, true), {}, recipientText(humanizerInfo, dest, txn.from, true))

        return [ parsed, swapCall ].flat().filter(x => x)
    }
  }
}
const mapping = (humanizerInfo) => {
    return { 
        ...OneInchMapping(humanizerInfo), 
        ...SwappinMapping(humanizerInfo)
    }
} 

export default mapping
