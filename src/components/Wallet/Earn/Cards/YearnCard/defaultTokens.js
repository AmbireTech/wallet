const zapperStorage = 'https://storage.googleapis.com/zapper-fi-assets/tokens'

const tokens = [
    {
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        symbol: 'WETH'
    }
]

const getDefaultTokensItems = network => {
    const items = tokens.map(token => ({
        ...token,
        img: `${zapperStorage}/${network}/${token.address}.png`,
        balance: 0,
        balanceRaw: '0',
    }))

    return [
        ...items.map(token => ({ ...token, type: 'deposit' })),
        ...items.map(token => ({ ...token, type: 'withdraw', symbol: `yv${token.symbol}` }))
    ]
}

export { getDefaultTokensItems }