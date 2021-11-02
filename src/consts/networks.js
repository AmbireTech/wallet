const networks = [{
		id: 'ethereum',
		chainId: 1,
		rpc: 'https://mainnet.infura.io/v3/3d22938fd7dd41b7af4197752f83e8a1',
		nativeAssetSymbol: 'ETH',
		name: 'Ethereum'
	},  {
		id: 'polygon',
		chainId: 137,
		rpc: 'https://polygon-rpc.com/rpc',
		nativeAssetSymbol: 'MATIC',
		name: 'Polygon'
	}, {
		id: 'avalanche',
		chainId: 43114,
		rpc: 'https://api.avax.network/ext/bc/C/rpc',
		nativeAssetSymbol: 'AVAX',
		name: 'Avalanche'
	}, {
		id: 'arbitrum',
		chainId: 42161,
		rpc: 'https://arb1.arbitrum.io/rpc',
		nativeAssetSymbol: 'AETH',
		name: 'Arbitrum'
}]

export default networks
