const networks = [{
		id: 'ethereum',
		chainId: 1,
		//rpc: 'https://mainnet.infura.io/v3/3d22938fd7dd41b7af4197752f83e8a1',
		//rpc: 'https://morning-wild-water.quiknode.pro/66011d2c6bdebc583cade5365086c8304c13366c/',
		rpc: 'https://mainnet.infura.io/v3/d4319c39c4df452286d8bf6d10de28ae',
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
		explorerUrl: 'https://snowtrace.io'
	}, {
		// to match the zapper ID
		id: 'binance-smart-chain',
		chainId: 56,
		rpc: 'https://bsc-dataseed1.defibit.io',
		nativeAssetSymbol: 'BNB',
		name: 'Binance Smart Chain',
		icon: '/resources/networks/bsc.png',
		explorerUrl: 'https://bscscan.com'
	}, {
		id: 'fantom',
		chainId: 250,
		rpc: 'https://rpc.ftm.tools',
		nativeAssetSymbol: 'FTM',
		name: 'Fantom Opera',
		icon: '/resources/networks/fantom.png',
		explorerUrl: 'https://ftmscan.com'
	}/*, {
		id: 'arbitrum',
		chainId: 42161,
		rpc: 'https://arb1.arbitrum.io/rpc',
		nativeAssetSymbol: 'AETH',
		name: 'Arbitrum',
		icon: '/resources/networks/arbitrum.svg',
		explorerUrl: 'https://arbiscan.io'
}*/]

export default networks
