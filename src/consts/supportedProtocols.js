// List of all supported protocols by networks: https://api.zapper.fi/v1/protocols/balances/supported?api_key=5d1237c2-3840-4733-8e92-c5a58fe81b88

const suportedProtocols = [
    {
        network: 'ethereum',
        protocols: ['1inch', 'aave-v2', 'alchemix', 'badger', 'balancer-v2', 'compound', 'cream', 'curve', 'sushiswap', 'uniswap-v2', 'uniswap-v3', 'nft']
    },
    {
        network: 'polygon',
        protocols: ['aave-v2', 'quickswap', 'sushiswap']
    },
    {
        network: 'avalanche',
        protocols: ['aave-v2']
    },
    {
        network: 'binance-smart-chain',
        protocols: ['pancakeswap']
    }
]

export default suportedProtocols
