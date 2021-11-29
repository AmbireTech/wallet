#!/usr/bin/env node
const fs = require('fs')
const fetch = require('node-fetch')
const contracts = require('./contracts')
const timer = ms => new Promise(res => setTimeout(res, ms))

const chains = {
  ethereum: {
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    api: { host: 'api.etherscan.io', key: 'KJJ4NZ9EQHIFCQY5IJ775PT128YE15AV5S' }
  },
  polygon: {
    nativeSymbol: 'MATIC',
    nativeDecimals: 18,
    api: { host: 'api.polygonscan.com', key: 'YE5YYHA7BH6IPBN5T71UKW5MPEFZ5HUGJJ' }
  },
  //bsc: { nativeSymbol: "BNB", nativeDecimals: 18 },
  //avalanche: { nativeSymbol: "AVAX", nativeDecimals: 18 },
}

const tokenlists = [
  {
    network: 'ethereum',
    url: 'https://github.com/trustwallet/assets/raw/master/blockchains/ethereum/tokenlist.json'
  },
  {
    network: 'polygon',
    url: 'https://github.com/trustwallet/assets/raw/master/blockchains/polygon/tokenlist.json'
  },
  {
    network: 'polygon',
    url: 'https://api-polygon-tokens.polygon.technology/tokenlists/allTokens.tokenlist.json'
  }
]

async function generate() {
  let abis = {}
  let delay = 0

  let contractsToFetch = contracts.filter(a => a.abiName !== null && a.abiName !== undefined).length
  let contractsFetched = 0

  for (let contract of contracts) {
    const { network, address, abiName, abiAddress, replacementABI } = contract
    if (!abiName) continue
    const normalizedAbiName = abiName.toLowerCase()
    if (replacementABI) {
      abis[normalizedAbiName] = replacementABI
    } else {
      const { api } = chains[network]
      // @TODO rate limiting
      await timer(delay++ * 400)
      console.log("Fetching " + abiName)
      const abiResp = await fetch(`https://${api.host}/api?module=contract&action=getabi&address=${abiAddress || address}&apikey=${api.key}`)
        .then((r) => {
          contractsFetched++
          console.log(contractsFetched + '/' + contractsToFetch)
          return r.json()
        })
      if (abiResp.status !== '1') throw abiResp
      abis[normalizedAbiName] = JSON.parse(abiResp.result)
    }
  }

  let names = {}
  contracts.forEach(({ name, address, network }) => {
    if (!address) {
      console.log('no address for ' + name)
      return
    }
    const normalizedAddress = address.toLowerCase()
    if (names[normalizedAddress] && names[normalizedAddress].name !== name) throw new Error(`unexpected name confict: ${address} ${name} with existing ${JSON.stringify(names[normalizedAddress])}`)
    if (!names[normalizedAddress]) {
      names[normalizedAddress] = {
        name: name,
        networks: []
      }
    }
    names[normalizedAddress].networks.push(network)
  })

  const tokenLists = await Promise.all(tokenlists.map(
    async list => {
      return {
        json: await fetch(list.url).then(r => r.json()),
        network: list.network
      }
    }
  ))
  const tokens = tokenLists.reduce((acc, list) => {
    list.json.tokens.forEach(t => {
      const address = t.address.toLowerCase()
      if (acc[address] && acc[address].decimals !== acc[address].decimals) {
        throw new Error('unexpected token conflict: same addr token, different decimals')
      }
      if (!acc[address]) acc[address] = [t.symbol, t.decimals, []]
      if (acc[address][2].indexOf(list.network) === -1) {
        acc[address][2].push(list.network)
      }
    })
    return acc
  }, {})

  for (let c in chains) {
    tokens['native_' + c] = [chains[c].nativeSymbol, chains[c].nativeDecimals, [c]]
  }

  const output = { abis, tokens, names }
  const outputStr = JSON.stringify(output, '\n', '\t')

  fs.writeFileSync('../src/consts/abi_blob.json', outputStr)
}

generate()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
