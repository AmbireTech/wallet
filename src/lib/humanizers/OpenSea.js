import { abis } from 'consts/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
import { nativeToken, token } from 'lib/humanReadableTransactions';

const WyvernExchange = new Interface(abis.WyvernExchange)

const MovrMapping = {
  [WyvernExchange.getSighash('atomicMatch_')]: (txn, network, { extended = false }) => {
    const { addrs, uints } = WyvernExchange.parseTransaction(txn).args
    const seller = addrs[1]
    const tokenAddress = addrs[6]
    const price = uints[4]
    const paymentToken = Number(tokenAddress) === 0 ? nativeToken(network, price, true) : token(tokenAddress, price, true)
    return !extended ?
        [`Buy nft from ${seller} for ${price} ETH on OpenSea`]
        : 
        [[
            'Buy',
            'nft from',
            {
                type: 'address',
                address: seller
            },
            'for',
            {
                type: 'token',
                ...paymentToken
            },
            'on OpenSea'
        ]]
  },
}
export default MovrMapping