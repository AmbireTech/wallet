#!/usr/bin/env node
const fs = require('fs')
const fetch = require('node-fetch')
const {getAddress} = require('ethers').utils
const timer = ms => new Promise(res => setTimeout(res, ms))

const genericMaps = require('./genericMaps')
const genericContracts = require('./genericContracts')
const specificContracts = require('./specificContracts')

const etherscans = {
  ethereum: {host: 'api.etherscan.io', key: 'KJJ4NZ9EQHIFCQY5IJ775PT128YE15AV5S'},
  polygon: {host: 'api.polygonscan.com', key: 'YE5YYHA7BH6IPBN5T71UKW5MPEFZ5HUGJJ'}
}

const tokenlists = [
  {network: 'ethereum', url: 'https://github.com/trustwallet/assets/raw/master/blockchains/ethereum/tokenlist.json'},
  {network: 'polygon', url: 'https://github.com/trustwallet/assets/raw/master/blockchains/polygon/tokenlist.json'},
]

async function generate() {
  let output = {}

  let delay = 0
  await Promise.all(genericContracts.map(async ({name, network, address, replacementABI, implementationAddress}) => {
    if (replacementABI) {
      output['_' + name.toLowerCase()] = {name, abi: replacementABI, addresses: []}
      return
    }
    const {host, key} = etherscans[network]
    await timer(delay++ * 400)
    const fetchAddr = implementationAddress || address
    const abiResp = await fetch(`https://${host}/api?module=contract&action=getabi&address=${fetchAddr}&apikey=${key}`)
      .then(r => r.json())
    if (abiResp.status !== '1') throw abiResp
    console.log(Object.values(output).length + '/' + (genericContracts.length + specificContracts.length))
    output['_' + name.toLowerCase()] = {name, abi: JSON.parse(abiResp.result), addresses: []}
  }))

  delay = 0
  await Promise.all(specificContracts.map(async ({name, network, address, implementationAddress}) => {
    const {host, key} = etherscans[network]
    await timer(delay++ * 400)
    const fetchAddr = implementationAddress || address
    const abiResp = await fetch(`https://${host}/api?module=contract&action=getabi&address=${fetchAddr}&apikey=${key}`)
      .then(r => r.json())
    if (abiResp.status !== '1') throw abiResp
    console.log(Object.values(output).length + '/' + (genericContracts.length + specificContracts.length))
    output[network + ':' + address.toLowerCase()] = {
      name, abi: JSON.parse(abiResp.result), addresses: [{
        name,
        address: getAddress(address),
        network
      }]
    }
  }))

  const tokenLists = []
  await Promise.all(tokenlists.map(
    async list => {
      tokenLists.push({
        network: list.network,
        tokens: (await fetch(list.url).then(r => r.json())).tokens
      })
    }
  ))

  const tokens = tokenLists.reduce((acc, list) => {
    list.tokens.forEach(t => {
      if (!acc[list.network]) acc[list.network] = {}
      if (acc[list.network][t.address] && acc[list.network][t.address].decimals !== acc[list.network][t.address].decimals) throw new Error('unexpected token conflict: same addr token, different decimals')
      acc[list.network][t.address] = [t.symbol, t.decimals]
    })
    return acc
  }, {})

  for (let chain in tokens) {
    for (let addr in tokens[chain]) {
      output['_erc20'].addresses.push({
        address: addr,
        name: tokens[chain][addr][0],
        network: chain
      })
    }
  }

  genericMaps.forEach(i => {
    if (!output['_' + i.generic.toLowerCase()]) {
      throw new Error('Could not find generic contract ' + i.generic)
    }
    output['_' + i.generic.toLowerCase()].addresses.push({
      address: i.address,
      name: i.name,
      network: i.network
    })
  })

  console.log(JSON.stringify({
    verifiedContracts: output,
    tokens
  }))

  fs.writeFileSync('../src/consts/abi_blob.json', JSON.stringify({verifiedContracts: output, tokens}, '\n', '\t'))
}

generate()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e)
    process.exit(1)
  })



