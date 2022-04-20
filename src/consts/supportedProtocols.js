// List of all supported protocols by networks: https://api.zapper.fi/v1/protocols/balances/supported?api_key=5d1237c2-3840-4733-8e92-c5a58fe81b88

const suportedProtocols = [
    {
        network: 'ethereum',
        // protocols: ['1inch', 'aave-v2', 'alchemix', 'badger', 'balancer-v2', 'compound', 'cream', 'curve', 'sushiswap', 'uniswap-v2', 'uniswap-v3', 'nft'],
        protocols: ['nft'],
        balancesProvider: 'velcro',
        nftsProvider: 'velcro'
    },
    {
        network: 'polygon',
        // protocols: ['aave-v2', 'quickswap', 'sushiswap', 'nft'],
        protocols: ['nft'],
        balancesProvider: 'velcro',
        nftsProvider: 'velcro'
    },
    {
        network: 'avalanche',
        // protocols: ['aave-v2'],
        protocols: [],
        balancesProvider: 'velcro'
    },
    {
        network: 'binance-smart-chain',
        // protocols: ['pancakeswap'],
        protocols: ['nft'],
        balancesProvider: 'velcro',
        nftsProvider: 'velcro'
    },
    {
        network: 'fantom',
        protocols: [],
	    balancesProvider: 'velcro'
    },
    {
        network: 'moonbeam',
        protocols: [],
	    balancesProvider: 'velcro'
    },
    {
        network: 'moonriver',
        protocols: [],
	    balancesProvider: 'velcro'
    },
    {
        network: 'arbitrum',
        protocols: ['nft'],
        balancesProvider: 'velcro',
        nftsProvider: 'velcro'
    },
    {
        network: 'gnosis',
        protocols: [],
        balancesProvider: 'velcro',
        nftsProvider: 'velcro'
    },
    // {
    //     network: 'kucoin',
    //     protocols: [],
    //     balancesProvider: 'velcro',
    //     nftsProvider: 'velcro'
    // },
    // {
    //     network: 'andromeda',
    //     protocols: [],
    //     balancesProvider: 'velcro',
    //     nftsProvider: 'velcro'
    // },
    // {
    //     network: 'cronos',
    //     protocols: [],
    //     balancesProvider: 'velcro',
    //     nftsProvider: 'velcro'
    // },
    // {
    //     network: 'aurora',
    //     protocols: [],
    //     balancesProvider: 'velcro',
    //     nftsProvider: 'velcro'
    // }
]

export default suportedProtocols
