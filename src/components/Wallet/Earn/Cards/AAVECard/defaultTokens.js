import { getTokenIcon } from 'lib/icons'

let tokens = {
    ethereum: [
        {
            address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            symbol: 'WETH'
        },
        {
            address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
            symbol: 'WBTC'
        },
        {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC'
        },
        {
            address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            symbol: 'USDT'
        },
        {
            address: '0x6b175474e89094c44da98b954eedeac495271d0f',
            symbol: 'DAI'
        },
        {
            address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
            symbol: 'AAVE'
        },
    ],
    polygon: [
        {
            address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
            symbol: 'WETH'
        },
        {
            address: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
            symbol: 'WBTC'
        },
        {
            address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
            symbol: 'USDC'
        },
        {
            address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
            symbol: 'USDT'
        },
        {
            address: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
            symbol: 'DAI'
        },
        {
            address: '0xd6df932a45c0f255f85145f286ea0b292b21c90b',
            symbol: 'AAVE'
        },
    ],
    avalanche: [
        {
            address: '0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab',
            symbol: 'WETH.e'
        },
        {
            address: '0x50b7545627a5162f82a992c33b87adc75187b218',
            symbol: 'WBTC.e'
        },
        {
            address: '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664',
            symbol: 'USDC.e'
        },
        {
            address: '0xc7198437980c041c805a1edcba50c1ce5db95118',
            symbol: 'USDT.e'
        },
        {
            address: '0xd586e7f844cea2f87f50152665bcbc2c279d8d70',
            symbol: 'DAI.e'
        },
        {
            address: '0x63a72806098bd3d9520cc43356dd78afe5d386d9',
            symbol: 'AAVE.e'
        },
    ],
    'binance-smart-chain': []
}

const getDefaultTokensItems = network => {
    const items = (tokens[network] || []).map(token => ({
        ...token,
        img: getTokenIcon(network, token.address),
        balance: 0,
        balanceRaw: '0',
    })) || []

    return [
        ...items.map(token => ({ ...token, type: 'deposit' })),
        ...items.map(token => ({ ...token, type: 'withdraw', symbol: `a${token.symbol}` }))
    ]
}

export { getDefaultTokensItems }
