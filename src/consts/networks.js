const networks = [
	{
		id: 'ethereum',
		chainId: 1,
		//rpc: 'https://mainnet.infura.io/v3/3d22938fd7dd41b7af4197752f83e8a1',
		//rpc: 'https://morning-wild-water.quiknode.pro/66011d2c6bdebc583cade5365086c8304c13366c/',
		rpc: 'https://mainnet.infura.io/v3/d4319c39c4df452286d8bf6d10de28ae',
		nativeAssetSymbol: 'ETH',
		name: 'Ethereum',
		icon: '/resources/networks/ethereum.png',
		explorerUrl: 'https://etherscan.io',
		unstoppableDomainsChain: 'ERC20'
	},
	{
		id: 'polygon',
		chainId: 137,
		rpc: 'https://polygon-rpc.com/rpc',
		// rpc: 'https://polygon-mainnet.infura.io/v3/d4319c39c4df452286d8bf6d10de28ae',
		nativeAssetSymbol: 'MATIC',
		name: 'Polygon',
		icon: '/resources/networks/polygon.png',
		explorerUrl: 'https://polygonscan.com',
		unstoppableDomainsChain: 'MATIC'
	},
	{
		id: 'avalanche',
		chainId: 43114,
		rpc: 'https://api.avax.network/ext/bc/C/rpc',
		nativeAssetSymbol: 'AVAX',
		name: 'Avalanche',
		icon: '/resources/networks/avalanche.png',
		explorerUrl: 'https://snowtrace.io',
		unstoppableDomainsChain: 'ERC20'
	},
	{
		// to match the zapper ID
		id: 'binance-smart-chain',
		chainId: 56,
		rpc: 'https://bsc-dataseed1.defibit.io',
		nativeAssetSymbol: 'BNB',
		name: 'Binance Smart Chain',
		icon: '/resources/networks/bsc.png',
		explorerUrl: 'https://bscscan.com',
		unstoppableDomainsChain: 'BEP20'
	},
	{
		id: 'fantom',
		chainId: 250,
		rpc: 'https://rpc.ftm.tools',
		nativeAssetSymbol: 'FTM',
		name: 'Fantom Opera',
		icon: '/resources/networks/fantom.png',
		explorerUrl: 'https://ftmscan.com',
		unstoppableDomainsChain: 'ERC20'
	},
	{
		id: 'moonbeam',
		chainId: 1284,
		rpc: 'https://rpc.api.moonbeam.network',
		nativeAssetSymbol: 'GLMR',
		name: 'Moonbeam',
		icon: '/resources/networks/moonbeam.png',
		explorerUrl: 'https://moonscan.io/',
		unstoppableDomainsChain: 'ERC20'
	},
	{
		id: 'moonriver',
		chainId: 1285,
		rpc: 'https://rpc.api.moonriver.moonbeam.network',
		nativeAssetSymbol: 'MOVR',
		name: 'Moonriver',
		icon: '/resources/networks/moonriver.png',
		explorerUrl: 'https://moonriver.moonscan.io/',
		unstoppableDomainsChain: 'ERC20'
	},
	{
		id: 'arbitrum',
		chainId: 42161,
		rpc: 'https://arb1.arbitrum.io/rpc',
		nativeAssetSymbol: 'AETH',
		name: 'Arbitrum',
		icon: '/resources/networks/arbitrum.svg',
		explorerUrl: 'https://arbiscan.io',
		unstoppableDomainsChain: 'ERC20'
	},
	{
		id: 'gnosis',
		chainId: 100,
		rpc: 'https://rpc.xdaichain.com',
		nativeAssetSymbol: 'XDAI',
		name: 'Gnosis',
		icon: '/resources/networks/gnosis.png',
		explorerUrl: 'https://blockscout.com',
		unstoppableDomainsChain: 'ERC20'
	},
	{
		id: 'kucoin',
		chainId: 321,
		rpc: 'https://rpc-mainnet.kcc.network',
		nativeAssetSymbol: 'KCS',
		name: 'KCC',
		icon: '/resources/networks/kucoin.svg',
		explorerUrl: 'https://explorer.kcc.io',
		unstoppableDomainsChain: 'ERC20'
	},
	{
		id: 'andromeda',
		chainId: 1088,
		rpc: 'https://andromeda.metis.io/?owner=1088',
		nativeAssetSymbol: 'METIS',
		name: 'Andromeda',
		icon: '/resources/networks/andromeda.svg',
		explorerUrl: 'https://andromeda-explorer.metis.io',
		unstoppableDomainsChain: 'ERC20'
	},
	{
		id: 'cronos',
		chainId: 25,
		rpc: 'https://evm-cronos.crypto.org',
		nativeAssetSymbol: 'CRO',
		name: 'Cronos',
		icon: '/resources/networks/cronos.png',
		explorerUrl: 'https://cronoscan.com',
		unstoppableDomainsChain: 'ERC20'
	},
	{
		id: 'aurora',
		chainId: 1313161554,
		rpc: 'https://mainnet.aurora.dev',
		nativeAssetSymbol: 'ETH',
		name: 'NEAR Aurora',
		icon: '/resources/networks/aurora.png',
		explorerUrl: 'https://aurorascan.dev',
		unstoppableDomainsChain: 'ERC20'
	}
]

export default networks
