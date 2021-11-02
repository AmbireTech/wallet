#!/usr/bin/env node
const fetch = require('node-fetch')
const fs = require('fs')

const etherscanAPIKey = ''//'KJJ4NZ9EQHIFCQY5IJ775PT128YE15AV5S'
const etherscans = {
	ethereum: 'api.etherscan.io',
	polygon: 'api.polygonscan.com'
}

const contracts = [
	{ name: 'SUSHI', network: 'polygon', contract: '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506' }
]

async function generate () {
	let output = {}
	await Promise.all(contracts.map(async ({ name, network, contract }) => {
		const abiResp = await fetch(`https://${etherscans[network]}/api?module=contract&action=getabi&address=${contract}&apikey=${etherscanAPIKey}`)
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



