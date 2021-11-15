const networks = [{
		id: 'ethereum',
		chainId: 1,
		rpc: 'https://mainnet.infura.io/v3/3d22938fd7dd41b7af4197752f83e8a1',
		nativeAssetSymbol: 'ETH',
		name: 'Ethereum',
		icon: '/resources/networks/ethereum.png',
		explorerUrl: 'https://etherscan.io'
	},  {
		id: 'polygon',
		chainId: 137,
		rpc: 'https://polygon-rpc.com/rpc',
		nativeAssetSymbol: 'MATIC',
		name: 'Polygon',
		icon: '/resources/networks/polygon.png',
		explorerUrl: 'https://polygonscan.com'
	}, {
		id: 'avalanche',
		chainId: 43114,
		rpc: 'https://api.avax.network/ext/bc/C/rpc',
		nativeAssetSymbol: 'AVAX',
		name: 'Avalanche',
		icon: '/resources/networks/avalanche.png',
		explorerUrl: 'https://cchain.explorer.avax.network'
	}, {
		id: 'arbitrum',
		chainId: 42161,
		rpc: 'https://arb1.arbitrum.io/rpc',
		nativeAssetSymbol: 'AETH',
		name: 'Arbitrum',
		icon: '/resources/networks/arbitrum.svg',
		explorerUrl: 'https://arbiscan.io'
}]

export default networks
