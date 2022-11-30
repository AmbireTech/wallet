import networks, { NetworkId, NETWORKS, NetworkType } from 'ambire-common/src/constants/networks'
import { providers } from 'ethers'

export const rpcUrls = {
  // ethereum: 'https://mainnet.infura.io/v3/3d22938fd7dd41b7af4197752f83e8a1',
  // ethereum: 'https://morning-wild-water.quiknode.pro/66011d2c6bdebc583cade5365086c8304c13366c/',
  // ethereum: 'https://mainnet.infura.io/v3/d4319c39c4df452286d8bf6d10de28ae',
  ethereum: 'https://eth-mainnet.alchemyapi.io/v2/SBG22nxioGnHZCCFJ9C93SIN82e9TUHS',
  polygon: 'https://rpc.ankr.com/polygon', // temp - 5M per month and 170k per day
  avalanche: 'https://rpc.ankr.com/avalanche',
  'binance-smart-chain': 'https://bsc-dataseed1.defibit.io',
  fantom: 'https://rpc.ftm.tools',
  moonbeam: 'https://rpc.api.moonbeam.network',
  moonriver: 'https://rpc.api.moonriver.moonbeam.network',
  arbitrum: 'https://arb-mainnet.g.alchemy.com/v2/wBLFG9QR-n45keJvKjc4rrfp2F1sy1Cp',
  // gnosis: 'https://rpc.xdaichain.com',
  gnosis: 'https://rpc.ankr.com/gnosis',
  kucoin: 'https://rpc-mainnet.kcc.network',
  optimism: 'https://mainnet.optimism.io',
  andromeda: 'https://andromeda.metis.io/?owner=1088',
  rinkeby: 'https://rinkeby.infura.io/v3/4409badb714444b299066870e0f7b631',
  cronos: 'https://evm-cronos.crypto.org',
  aurora: 'https://mainnet.aurora.dev',
  'ethereum-pow': 'https://mainnet.ethereumpow.org'
}


// @ts-ignore
const rpcProviders: { [key in NetworkId]: any } = {}
const calls = {}
const startTime = new Date().getTime()
setInterval(function(){
  let totalCalls = 0
  console.log('-'.repeat(40));
  console.log(`For ${(new Date().getTime() - startTime) / 1000} seconds:`)
  Object.keys(calls).forEach(c => {
    totalCalls = totalCalls + calls[c]
    console.log(`${c} ==> ${calls[c]}`)
  })
  console.log('total calls::', totalCalls)
  console.log('-'.repeat(40));
  
},10000)

const setProvider = (_id: NetworkId) => {
  // eslint-disable-next-line no-underscore-dangle
  const url = rpcUrls[_id]
  const network = networks.find(({ id }) => id === _id)
  if (!network) return null

  const { id: name, chainId, ensName } = network as NetworkType
  let prov
  if (url.startsWith('wss:')) {
    prov = new providers.WebSocketProvider(url, {
      name: ensName || name,
      chainId
    })
  } else {
    prov = new providers.StaticJsonRpcProvider(url, {
      name: ensName || name,
      chainId
    })
  }
// return prov
  return new Proxy(prov, {
    get: (target, prop, receiver) => {
      // console.log(`GET:::`,{target, prop, receiver})
      if (typeof target[prop] === 'function'){
        return function () {
          let to
          let data
          Object.keys(arguments).forEach(x => {
            if (arguments[x] && arguments[x].to) to = arguments[x].to
            if (arguments[x] && arguments[x].data) data = arguments[x].data
          })
          // console.log(new Date().toLocaleString(), `===> to:::${to}`)
          if (to && data && to === '0x47Cd7E91C3CBaAF266369fe8518345fc4FC12935') calls[`${to}::${data.substr(0,9)}`] = calls[`${to}::${data.substr(0,9)}`] ? calls[`${to}::${data.substr(0,9)}`] + 1 : 1
          else if (to) calls[to] = calls[to] ? calls[to] + 1 : 1
          else calls['unknown'] = calls['unknown'] ? calls['unknown'] + 1 : 1
          return target[prop](...arguments)
        }
      }
      return target[prop]
    }
  })
}

;(Object.keys(NETWORKS) as Array<keyof typeof NETWORKS>).forEach((networkId: NetworkId) => {
  rpcProviders[networkId] = setProvider(networkId)
})

export { rpcProviders }
