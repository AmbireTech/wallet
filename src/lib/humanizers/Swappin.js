import { abis } from 'ambire-common/src/constants/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
import { nativeToken, token } from 'lib/humanReadableTransactions';

const swappin = new Interface(abis.Swappin)

const SwappinMapping = {
  [swappin.getSighash('swap')]: (txn, network, { extended = false }) => {
    const { desc } = swappin.parseTransaction(txn).args
    
    const seller = desc.dstReceiver
    const tokenAddress = desc.dstToken
    const price = txn.value
    const amount = desc.amount
    const returnAmount = desc.minReturnAmount
    const srcTokenAddress = desc.srcToken
    const paymentSrcToken = Number(srcTokenAddress) === 0 ? nativeToken(network, price, true) : token(srcTokenAddress, parseFloat(amount), true)
    const paymentToken = Number(tokenAddress) === 0 ? nativeToken(network, price, true) : token(tokenAddress, parseFloat(returnAmount), true)

    return !extended ?
        [`Buy NFT from ${seller} for ${price} ETH on OpenSea`]
        : 
        [[
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
        ]]
  },
}

export default SwappinMapping
