import { Interface } from 'ethers/lib/utils'
import { nativeToken, token } from 'lib/humanReadableTransactions';

const OpenSeaMapping = (humanizerInfo) => {
    const WyvernExchange = new Interface(humanizerInfo.abis.WyvernExchange)

    return {
    [WyvernExchange.getSighash('atomicMatch_')]: (txn, network, { extended = false }) => {
        const { addrs, uints } = WyvernExchange.parseTransaction(txn).args
        const seller = addrs[1]
        const tokenAddress = addrs[6]
        const price = uints[4]
        const paymentToken = Number(tokenAddress) === 0 ? nativeToken(network, price, true) : token(humanizerInfo, tokenAddress, price, true)
        return !extended ?
            [`Buy NFT from ${seller} for ${price} ETH on OpenSea`]
            : 
            [[
                'Buy',
                'NFT from',
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
    [WyvernExchange.getSighash('approveOrder_')]: (txn, network, { extended = false }) => {
        const { addrs, uints } = WyvernExchange.parseTransaction(txn).args
        const collection = addrs[4]
        const tokenAddress = addrs[6]
        const price = uints[4]
        const paymentToken = Number(tokenAddress) === 0 ? nativeToken(network, price, true) : token(humanizerInfo, tokenAddress, price, true)
        return !extended ?
            [`Approve to submit an order of ${price} WETH to buy bft from ${collection} on OpenSea`]
            : 
            [[
                'Approve',
                'to submit an order of',
                {
                    type: 'token',
                    ...paymentToken
                },
                'to buy NFT from',
                {
                    type: 'address',
                    address: collection
                },
                'on OpenSea'
            ]]
    },
    }
}
export default OpenSeaMapping
