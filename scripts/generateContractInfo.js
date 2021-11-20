#!/usr/bin/env node
const fetch = require('node-fetch')
const { getAddress } = require('ethers').utils

const etherscans = {
	ethereum: { host: 'api.etherscan.io', key: 'KJJ4NZ9EQHIFCQY5IJ775PT128YE15AV5S' },
	polygon: { host: 'api.polygonscan.com', key: 'YE5YYHA7BH6IPBN5T71UKW5MPEFZ5HUGJJ' }
}

const contracts = [
	{ name: 'Uniswap', network: 'ethereum', addr: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', abiName: 'UniV2Router' },
	{ name: 'Uniswap', network: 'ethereum', addr: '0xe592427a0aece92de3edee1f18e0157c05861564', abiName: 'UniV3Router' },
	{ name: 'SushiSwap', network: 'polygon', addr: '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506' },
	{ name: 'SushiSwap', network: 'ethereum', addr: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F' },
	{ name: 'QuickSwap', network: 'polygon', addr: '0xa5e0829caced8ffdd4de3c43696c57f7d7a678ff' },
	//{ name: 'SushiSwap', network: 'polygon', contract: '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506' },
]
const tokenlists = [
	'https://github.com/trustwallet/assets/raw/master/blockchains/ethereum/tokenlist.json',
	'https://github.com/trustwallet/assets/raw/master/blockchains/polygon/tokenlist.json'
]

async function generate () {
	let abis = {}
	for (let contract of contracts) {
		const { network, addr, abiName } = contract
		if (!abiName) continue
		const { host, key } = etherscans[network]
		// @TODO rate limiting
		const abiResp = await fetch(`https://${host}/api?module=contract&action=getabi&address=${addr}&apikey=${key}`)
			.then(r => r.json())
		if (abiResp.status !== '1') throw abiResp
		abis[abiName] = JSON.parse(abiResp.result)
	}

	let names = {}
	contracts.forEach(({ name, addr }) => {
		const address = addr.toLowerCase()
		if (names[address] && names[address] !== name) throw new Error(`unexpected name confict: ${addr} ${name}`)
		names[address] = name
	})

	const tokenLists = await Promise.all(tokenlists.map(
		async url => await fetch(url).then(r => r.json())
	))
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

	console.log(JSON.stringify({ abis, tokens, names }))
}

generate()
	.then(() => process.exit(0))
	.catch(e => {
		console.error(e)
		process.exit(1)
	})



