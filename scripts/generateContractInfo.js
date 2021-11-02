#!/usr/bin/env node
const fetch = require('node-fetch')
const fs = require('fs')

const etherscans = {
	ethereum: { host: 'api.etherscan.io', key: 'KJJ4NZ9EQHIFCQY5IJ775PT128YE15AV5S' },
	polygon: { host: 'api.polygonscan.com', key: 'YE5YYHA7BH6IPBN5T71UKW5MPEFZ5HUGJJ' }
}

// @TODO dedupe ABIs and reference them by hash or something
const contracts = [
	{ name: 'SUSHI', network: 'polygon', contract: '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506' },
	{ name: 'SUSHI', network: 'ethereum', contract: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F' },
	//{ name: 'SUSHI', network: 'polygon', contract: '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506' },
]

async function generate () {
	let output = {}
	await Promise.all(contracts.map(async ({ name, network, contract }) => {
		const { host, key } = etherscans[network]
		const abiResp = await fetch(`https://${host}/api?module=contract&action=getabi&address=${contract}&apikey=${key}`)
			.then(r => r.json())
		if (abiResp.status !== '1') throw abiResp
		output[network+':'+contract] = { name, abi: JSON.parse(abiResp.result) }
	}))

	console.log(JSON.stringify(output))
}

generate()
	.then(() => process.exit(0))
	.catch(e => {
		console.error(e)
		process.exit(1)
	})



