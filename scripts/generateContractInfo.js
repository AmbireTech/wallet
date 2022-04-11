#!/usr/bin/env node
const fetch = require('node-fetch')
const ERC20 = require('adex-protocol-eth/abi/ERC20')

const etherscans = {
	ethereum: { host: 'api.etherscan.io', key: 'KJJ4NZ9EQHIFCQY5IJ775PT128YE15AV5S' },
	polygon: { host: 'api.polygonscan.com', key: 'YE5YYHA7BH6IPBN5T71UKW5MPEFZ5HUGJJ' },
	bsc: { host: 'api.bscscan.com', key: 'YQM54RYW91YSQA4QJZIJT4E6NWGKTZKQG3' }
}

const yearnVaults = [
	{ name: 'Yearn WETH Vault', network: 'ethereum', addr: '0xa258C4606Ca8206D8aA700cE2143D7db854D168c', abiName: 'YearnVault', baseToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
	{ name: 'Yearn USDC Vault', network: 'ethereum', addr: '0xa354F35829Ae975e850e23e9615b11Da1B3dC4DE', baseToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
	{ name: 'Yearn USDT Vault', network: 'ethereum', addr: '0x7Da96a3891Add058AdA2E826306D812C638D87a7', baseToken: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
	{ name: 'Yearn DAI Vault', network: 'ethereum', addr: '0xdA816459F1AB5631232FE5e97a05BBBb94970c95', baseToken: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
	{ name: 'Yearn YFI Vault', network: 'ethereum', addr: '0xdb25cA703181E7484a155DD612b06f57E12Be5F0', baseToken: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e', decimals: 18 },
	{ name: 'Yearn WBTC Vault', network: 'ethereum', addr: '0xA696a63cc78DfFa1a63E9E50587C197387FF6C7E', baseToken: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8 },
	{ name: 'Yearn 1INCH Vault', network: 'ethereum', addr: '0xB8C3B7A2A618C552C23B1E4701109a9E756Bab67', baseToken: '0x111111111117dC0aa78b770fA6A738034120C302', decimals: 18 },
	{ name: 'Yearn HEGIC Vault', network: 'ethereum', addr: '0xe11ba472F74869176652C35D30dB89854b5ae84D', baseToken: '0x584bC13c7D411c00c01A62e8019472dE68768430', decimals: 18 },
	{ name: 'Yearn UNI Vault', network: 'ethereum', addr: '0xFBEB78a723b8087fD2ea7Ef1afEc93d35E8Bed42', baseToken: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18 },
	{ name: 'Yearn SUSHI Vault', network: 'ethereum', addr: '0x6d765CbE5bC922694afE112C140b8878b9FB0390', baseToken: '0x6B3595068778DD592e39A122f4f5a5cF09C90fE2', decimals: 18 },
	{ name: 'Yearn TUSD Vault', network: 'ethereum', addr: '0xFD0877d9095789cAF24c98F7CCe092fa8E120775', baseToken: '0x0000000000085d4780B73119b644AE5ecd22b376', decimals: 18 },
	{ name: 'Yearn AAVE Vault', network: 'ethereum', addr: '0xd9788f3931Ede4D5018184E198699dC6d66C1915', baseToken: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', decimals: 18 },
]
const tesseractVaults = [
	{ name: 'Tesseract USDC Vault', network: 'polygon', addr: '0x57bDbb788d0F39aEAbe66774436c19196653C3F2', baseToken: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', decimals: 6 },
	{ name: 'Tesseract DAI Vault', network: 'polygon', addr: '0x4c8C6379b7cd039C892ab179846CD30a1A52b125', baseToken: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063', decimals: 18 },
	{ name: 'Tesseract WBTC Vault', network: 'polygon', addr: '0x6962785c731e812073948a1f5E181cf83274D7c6', baseToken: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6', decimals: 8 },
	{ name: 'Tesseract WETH Vault', network: 'polygon', addr: '0x3d44F03a04b08863cc8825384f834dfb97466b9B', baseToken: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619', decimals: 18 },
	{ name: 'Tesseract WMATIC Vault', network: 'polygon', addr: '0xE11678341625cD88Bb25544e39B2c62CeDcC83f1', baseToken: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270', decimals: 18 },
]
const contracts = [
	{ name: '$WALLET distributor', network: 'ethereum', addr: '0xc53af25f831f31ad6256a742b3f0905bc214a430' },
	{ name: 'Uniswap', network: 'ethereum', addr: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', abiName: 'UniV2Router' },
	{ name: 'Uniswap', network: 'ethereum', addr: '0xe592427a0aece92de3edee1f18e0157c05861564', abiName: 'UniV3Router' },
	{ name: 'Uniswap', network: 'ethereum', addr: '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45', abiName: 'UniV3Router2' },
	{ name: 'SushiSwap', network: 'ethereum', addr: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F' },
	{ name: 'SushiSwap', network: 'polygon', addr: '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506' },
	{ name: 'SushiSwap', network: 'fantom', addr: '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506' },
	{ name: 'SushiSwap', network: 'bsc', addr: '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506' },
	{ name: 'SushiSwap', network: 'avalanche', addr: '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506' },
	{ name: 'QuickSwap', network: 'polygon', addr: '0xa5e0829caced8ffdd4de3c43696c57f7d7a678ff' },
	{ name: 'Wrapped ETH', network: 'ethereum', addr: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', abiName: 'WETH' },
	{ name: 'Wrapped MATIC', network: 'polygon', addr: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270' },
	{ name: 'Aave', network: 'ethereum', addr: '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9', abiAddr: '0xc6845a5c768bf8d7681249f8927877efda425baf', abiName: 'AaveLendingPoolV2' },
	{ name: 'Aave', network: 'polygon', addr: '0x8dff5e27ea6b7ac08ebfdf9eb090f32ee9a30fcf' },
	{ name: 'Aave', network: 'ethereum', addr: '0xcc9a0b7c43dc2a5f023bb9b738e45b0ef6b06e04', abiName: 'AaveWethGatewayV2' },
	{ name: 'Aave', network: 'polygon', addr: '0xbEadf48d62aCC944a06EEaE0A9054A90E5A7dc97' },
	{ name: 'Aave', network: 'fantom', addr: '0x17d013c19fe25cf4d911ce85ed5f40fe8880f46f' },
	{ name: 'Movr 1inch', network: 'ethereum', addr: '0x8f9eaee5c5df888aba3c1ab19689a0660d042c6d' },
	{ name: 'Movr 1inch', network: 'polygon', addr: '0x2fc9c3bf505b74e59a538fe9d67bc1deb4c03d91' },
	{ name: 'Movr Router', network: 'bsc', addr: '0xc30141B657f4216252dc59Af2e7CdB9D8792e1B0', abiName: 'MovrRouter' },
	{ name: 'Movr Anyswap', network: 'polygon', addr: '0x3901581b7ff54667a2bf51cb93dba704e60e24f4', abiName: 'MovrAnyswap' },
	//{ name: 'Movr Anyswap', network: 'polygon', addr: '0x43aa68673e54e95e07e8388bdd8612abe6df6f81' },
	{ name: 'Bored Ape Yacht Club', network: 'ethereum', addr: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d', abiName: 'ERC721' },
	...yearnVaults,
	...tesseractVaults,
	{ name: 'Ambire Factory', network: 'ethereum', addr: '0xBf07a0Df119Ca234634588fbDb5625594E2a5BCA', abiName: 'IdentityFactory' },
	{ name: 'Ambire Batcher', network: 'ethereum', addr: '0x460fad03099f67391d84c9cc0ea7aa2457969cea', abiName: 'Batcher' },
	{ name: 'WALLET Staking Pool', network: 'ethereum', addr: '0x47cd7e91c3cbaaf266369fe8518345fc4fc12935', abiName: 'StakingPool' },
	{ name: 'ADX Staking Pool', network: 'ethereum', addr: '0xb6456b57f03352be48bf101b46c1752a0813491a', abiName: 'StakingPool' },
	{ name: 'OpenSea', network: 'ethereum', addr: '0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b', abiName: 'WyvernExchange' }
]
const tokenlists = [
	'https://github.com/trustwallet/assets/raw/master/blockchains/ethereum/tokenlist.json',
	//'https://api.coinmarketcap.com/data-api/v3/uniswap/all.json',
	'https://tokens.coingecko.com/uniswap/all.json',
	'https://github.com/trustwallet/assets/raw/master/blockchains/polygon/tokenlist.json',
	'https://api-polygon-tokens.polygon.technology/tokenlists/allTokens.tokenlist.json'
]

const customTokens = [
	{
		address: '0x88800092ff476844f74dc2fc427974bbee2794ae',
		symbol: 'WALLET',
		decimals: 18
	},
	{
		address: '0x55d398326f99059ff775485246999027b3197955',
		symbol: 'USDT',
		decimal: 6
	},
	{
		address: '0x47cd7e91c3cbaaf266369fe8518345fc4fc12935',
		symbol: 'xWALLET',
		decimals: 18
	}
]

async function generate () {
	let abis = {}
	for (let contract of contracts) {
		const { network, addr, abiName, abiAddr } = contract
		if (!abiName) continue
		const { host, key } = etherscans[network]
		// @TODO rate limiting
		const abiResp = await fetch(`https://${host}/api?module=contract&action=getabi&address=${abiAddr || addr}&apikey=${key}`)
			.then(r => r.json())
		if (abiResp.status !== '1') throw abiResp
		abis[abiName] = JSON.parse(abiResp.result)
	}
	abis.ERC20 = ERC20

	let names = {}
	contracts.forEach(({ name, addr }) => {
		const address = addr.toLowerCase()
		if (names[address] && names[address] !== name) throw new Error(`unexpected name confict: ${addr} ${name}`)
		names[address] = name
	})

	const tokenLists = (await Promise.all(tokenlists.map(
		async url => await fetch(url).then(r => r.json())
	))).concat({tokens: customTokens})

	const tokens = tokenLists.reduce((acc, list) => {
		list.tokens.forEach(t => {
			const address = t.address.toLowerCase()
			if (acc[address] && acc[address].decimals !== acc[address].decimals) {
				throw new Error('unexpected token conflict: same addr token, different decimals')
			}
			acc[address] = [t.symbol, t.decimals]
		})
		return acc
	}, {})
	console.log(JSON.stringify({ abis, tokens, names, yearnVaults, tesseractVaults }))
}

generate()
	.then(() => process.exit(0))
	.catch(e => {
		console.error(e)
		process.exit(1)
	})



