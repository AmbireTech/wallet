import { getTokenIcon } from 'lib/icons'

let tokens = {
    ethereum: [
        {
            address: '0x030ba81f1c18d280636f32af80b9aad02cf0854e',
            symbol: 'aWETH',
            baseTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            baseTokenSymbol: 'WETH'
        },
        {
            address: '0x9ff58f4ffb29fa2266ab25e75e2a8b3503311656',
            symbol: 'aWBTC',
            baseTokenAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
            baseTokenSymbol: 'WBTC'
        },
        {
            address: '0xbcca60bb61934080951369a648fb03df4f96263c',
            symbol: 'aUSDC',
            baseTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            baseTokenSymbol: 'USDC'
        },
        {
            address: '0x3ed3b47dd13ec9a98b44e6204a523e766b225811',
            symbol: 'aUSDT',
            baseTokenAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            baseTokenSymbol: 'USDT'
        },
        {
            address: '0x028171bca77440897b824ca71d1c56cac55b68a3',
            symbol: 'aDAI',
            baseTokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
            baseTokenSymbol: 'DAI'
        },
        {
            address: '0xffc97d72e13e01096502cb8eb52dee56f74dad7b',
            symbol: 'aAAVE',
            baseTokenAddress: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
            baseTokenSymbol: 'AAVE'
        },
        {
            address: '0xa361718326c15715591c299427c62086f69923d9',
            symbol: 'aBUSD',
            baseTokenAddress: '0x4fabb145d64652a948d72533023f6e7a623c7c53',
            baseTokenSymbol: 'BUSD'
        }
    ],
    polygon: [
        {
            address: '0x28424507fefb6f7f8e9d3860f56504e4e5f5f390',
            symbol: 'amWETH',
            baseTokenAddress: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
            baseTokenSymbol: 'WETH'
        },
        {
            address: '0x5c2ed810328349100a66b82b78a1791b101c9d61',
            symbol: 'amWBTC',
            baseTokenAddress: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
            baseTokenSymbol: 'WBTC'
        },
        {
            address: '0x1a13f4ca1d028320a707d99520abfefca3998b7f',
            symbol: 'amUSDC',
            baseTokenAddress: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
            baseTokenSymbol: 'USDC'
        },
        {
            address: '0x60d55f02a771d515e077c9c2403a1ef324885cec',
            symbol: 'amUSDT',
            baseTokenAddress: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
            baseTokenSymbol: 'USDT'
        },
        {
            address: '0x27f8d03b3a2196956ed754badc28d73be8830a6e',
            symbol: 'amDAI',
            baseTokenAddress: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
            baseTokenSymbol: 'DAI'
        },
        {
            address: '0x1d2a0e5ec8e5bbdca5cb219e649b565d8e5c3360',
            symbol: 'amAAVE',
            baseTokenAddress: '0xd6df932a45c0f255f85145f286ea0b292b21c90b',
            baseTokenSymbol: 'AAVE'
        }
    ],
    avalanche: [
        {
            address: '0xe50fa9b3c56ffb159cb0fca61f5c9d750e8128c8',
            symbol: 'aAvaWETH',
            baseTokenAddress: '0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab',
            baseTokenSymbol: 'WETH.e'
        },
        {
            address: '0x078f358208685046a11c85e8ad32895ded33a249',
            symbol: 'aAvaWBTC',
            baseTokenAddress: '0x50b7545627a5162f82a992c33b87adc75187b218',
            baseTokenSymbol: 'WBTC.e'
        },
        {
            address: '0x625e7708f30ca75bfd92586e17077590c60eb4cd',
            symbol: 'aAvaUSDC',
            baseTokenAddress: '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664',
            baseTokenSymbol: 'USDC.e'
        },
        {
            address: '0x6ab707aca953edaefbc4fd23ba73294241490620',
            symbol: 'aAvaUSDT',
            baseTokenAddress: '0xc7198437980c041c805a1edcba50c1ce5db95118',
            baseTokenSymbol: 'USDT.e'
        },
        {
            address: '0x82e64f49ed5ec1bc6e43dad4fc8af9bb3a2312ee',
            symbol: 'aAvaDAI',
            baseTokenAddress: '0xd586e7f844cea2f87f50152665bcbc2c279d8d70',
            baseTokenSymbol: 'DAI.e'
        },
        {
            address: '0xf329e36c7bf6e5e86ce2150875a84ce77f477375',
            symbol: 'aAvaAAVE',
            baseTokenAddress: '0x63a72806098bd3d9520cc43356dd78afe5d386d9',
            baseTokenSymbol: 'AAVE.e'
        }
    ],
    'binance-smart-chain': []
}

const getDefaultTokensItems = network => {
    return [
        ...tokens[network].map(t => ({
            address: t.baseTokenAddress,
            baseTokenAddress: t.baseTokenAddress,
            symbol: t.baseTokenSymbol,
            name: t.baseTokenSymbol,
            img: getTokenIcon(network, t.baseTokenAddress),
            balance: 0,
            balanceRaw: '0',
            type: 'deposit'
        })) || [],
        ...tokens[network].map(t => ({
            address: t.address,
            baseTokenAddress: t.baseTokenAddress,
            symbol: t.symbol,
            name: t.symbol,
            img: getTokenIcon(network, t.baseTokenAddress),
            balance: 0,
            balanceRaw: '0',
            type: 'withdraw'
        })) || []
    ]
}

export { getDefaultTokensItems }
