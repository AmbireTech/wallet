// @ts-nocheck
import networks, { NetworkId, NETWORKS, NetworkType } from 'ambire-common/src/constants/networks'
import { providers } from 'ethers'

export const rpcUrls = {
  // Ankr RPCs for tests
  // ethereum:
  //   'https://rpc.ankr.com/eth/5eab0eb2ce05138695963ae1853b2ed0de083e1132f204704b6e7c32f7ea8a73',
  // polygon:
  //   'https://rpc.ankr.com/polygon/5eab0eb2ce05138695963ae1853b2ed0de083e1132f204704b6e7c32f7ea8a73',
  // fantom:
  //   'https://rpc.ankr.com/fantom/5eab0eb2ce05138695963ae1853b2ed0de083e1132f204704b6e7c32f7ea8a73',
  // 'binance-smart-chain':
  //   'https://rpc.ankr.com/bsc/5eab0eb2ce05138695963ae1853b2ed0de083e1132f204704b6e7c32f7ea8a73',
  // avalanche:
  //   'https://rpc.ankr.com/avalanche/5eab0eb2ce05138695963ae1853b2ed0de083e1132f204704b6e7c32f7ea8a73',
  // arbitrum:
  //   'https://rpc.ankr.com/arbitrum/5eab0eb2ce05138695963ae1853b2ed0de083e1132f204704b6e7c32f7ea8a73',
  // andromeda:
  //   'https://rpc.ankr.com/metis/5eab0eb2ce05138695963ae1853b2ed0de083e1132f204704b6e7c32f7ea8a73',
  // moonbeam:
  //   'https://rpc.ankr.com/moonbeam/5eab0eb2ce05138695963ae1853b2ed0de083e1132f204704b6e7c32f7ea8a73',
  // gnosis:
  //   'https://rpc.ankr.com/gnosis/5eab0eb2ce05138695963ae1853b2ed0de083e1132f204704b6e7c32f7ea8a73',
  // optimism:
  //   'https://rpc.ankr.com/optimism/5eab0eb2ce05138695963ae1853b2ed0de083e1132f204704b6e7c32f7ea8a73',
  // mumbai:
  //   'https://rpc.ankr.com/polygon_mumbai/5eab0eb2ce05138695963ae1853b2ed0de083e1132f204704b6e7c32f7ea8a73',
  // sepolia:
  //   'https://rpc.ankr.com/eth_sepolia/5eab0eb2ce05138695963ae1853b2ed0de083e1132f204704b6e7c32f7ea8a73',

  // original RPCs
  ethereum: 'https://eth-mainnet.alchemyapi.io/v2/e5Gr8LP_EH0SBPZiNCcC08OuEDrvgoYK',
  polygon: 'https://polygon-mainnet.g.alchemy.com/v2/JfC7t8yyhMt4UkYv3QgHaQZ79F98Xsma',
  avalanche: 'https://rpc.ankr.com/avalanche',
  'binance-smart-chain': 'https://bsc-dataseed1.defibit.io',
  fantom: 'https://rpc.ftm.tools',
  moonbeam: 'https://rpc.api.moonbeam.network',
  arbitrum: 'https://arb-mainnet.g.alchemy.com/v2/wBLFG9QR-n45keJvKjc4rrfp2F1sy1Cp',
  gnosis: 'https://rpc.ankr.com/gnosis',
  optimism: 'https://opt-mainnet.g.alchemy.com/v2/WoXh70mDVRLSfHao9i7ATeLKFmK7pHwm',
  andromeda: 'https://andromeda.metis.io/?owner=1088',
  mumbai: 'https://polygon-mumbai.g.alchemy.com/v2/rxBAvusV5YEzxEHX2LF9Y_jfIoRpIEGL',
  sepolia: 'https://eth-sepolia.g.alchemy.com/v2/nauTOhyzYtvU9NjWY00XrC73z0yzBYm_',

  // ethereum: 'https://mainnet.infura.io/v3/3d22938fd7dd41b7af4197752f83e8a1',
  // ethereum: 'https://morning-wild-water.quiknode.pro/66011d2c6bdebc583cade5365086c8304c13366c/',
  // ethereum: 'https://mainnet.infura.io/v3/d4319c39c4df452286d8bf6d10de28ae',
  // ethereum: 'https://eth-mainnet.alchemyapi.io/v2/e5Gr8LP_EH0SBPZiNCcC08OuEDrvgoYK',
  // polygon: 'https://rpc.ankr.com/polygon', // temp - 5M per month and 170k per day
  // avalanche: 'https://rpc.ankr.com/avalanche',
  // 'binance-smart-chain': 'https://bsc-dataseed1.defibit.io',
  // fantom: 'https://rpc.ftm.tools',
  // moonbeam: 'https://rpc.api.moonbeam.network',
  moonriver: 'https://rpc.api.moonriver.moonbeam.network',
  // arbitrum: 'https://arb-mainnet.g.alchemy.com/v2/wBLFG9QR-n45keJvKjc4rrfp2F1sy1Cp',
  // gnosis: 'https://rpc.xdaichain.com',
  // gnosis: 'https://rpc.ankr.com/gnosis',
  kucoin: 'https://rpc-mainnet.kcc.network',
  // optimism: 'https://mainnet.optimism.io',
  // optimism: 'https://opt-mainnet.g.alchemy.com/v2/WoXh70mDVRLSfHao9i7ATeLKFmK7pHwm',
  // andromeda: 'https://andromeda.metis.io/?owner=1088',
  rinkeby: 'https://rinkeby.infura.io/v3/4409badb714444b299066870e0f7b631',
  // mumbai: 'https://polygon-mumbai.g.alchemy.com/v2/rxBAvusV5YEzxEHX2LF9Y_jfIoRpIEGL',
  cronos: 'https://evm-cronos.crypto.org',
  aurora: 'https://mainnet.aurora.dev',
  'ethereum-pow': 'https://mainnet.ethereumpow.org',
  okc: 'https://exchainrpc.okex.org'
  // sepolia: 'https://eth-sepolia.g.alchemy.com/v2/nauTOhyzYtvU9NjWY00XrC73z0yzBYm_'
}

// @ts-ignore
const rpcProviders: { [key in NetworkId]: any } = {}
const CHECK_NET_INTERVAL_MS = 2000
const TRIES_LEFT = 10

const wait = (ms: number) => {
    return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
            resolve()
        }, ms)
    })
}

async function retryRPCPromiseWithDelay<Promise>(
    promise: any,
    retriesLeft: number,
    delay: number
): Promise {
    try {
        return await promise
    } catch (error) {
        if (retriesLeft === 0) {
            return Promise.reject(error)
        }
        await wait(delay)
        return retryRPCPromiseWithDelay(promise, retriesLeft - 1, delay)
    }
}
const handleTypeFunction = async(target: any, prop: string, args: any) => {
  let result
  if (prop === 'send' && args[0] === 'eth_chainId') {
    result = `0x${target._network.chainId.toString(16)}`
    return result
  }

  if (['getBlock', 'getBlockWithTransactions'].includes(prop)) {
    args[0] = args[0] === -1 ? 'latest' : args[0]
  }
  
  result = target[prop](...args)

  if (typeof result === 'object' && typeof result.then === 'function') {
    const res = await retryRPCPromiseWithDelay(result, TRIES_LEFT, CHECK_NET_INTERVAL_MS)
    return new Promise(resolve => resolve(res))
  }

  return result
}

const setProvider = (_id: NetworkId) => {
  // eslint-disable-next-line no-underscore-dangle
  const url = rpcUrls[_id]
  const network = networks.find(({ id }) => id === _id)
  if (!network) return null

  const { id: name, chainId, ensName } = network as NetworkType
  let provider
  if (url.startsWith('wss:')) {
    provider = new providers.WebSocketProvider(url, {
      name: ensName || name,
      chainId
    })
  } else {
    provider = new providers.StaticJsonRpcProvider(url, {
      name: ensName || name,
      chainId
    })
  }
  
  return new Proxy(provider, {
    get: function (target: any, prop: string, receiver) {
      if (typeof target[prop] === 'function') {
        return async function() {
          return await handleTypeFunction(target, prop, arguments)
        }
      }
      
      return target[prop]
    }
  })
}

;(Object.keys(NETWORKS) as Array<keyof typeof NETWORKS>).forEach(async(networkId: NetworkId) => {
  rpcProviders[networkId] = setProvider(networkId)
})

// Case specific RPCs:

const getChainId = (id: NetworkId): number => {
  const chainId = networks.find((x) => x.id === id)?.chainId
  if (chainId) {
    return chainId
  }
  throw new Error('Invalid NetworkId')
}

// @ts-ignore
rpcProviders['ethereum-ambire-earn'] = new providers.StaticJsonRpcProvider(
  'https://eth-mainnet.alchemyapi.io/v2/Qi7xcrPZH22WtSWDSB5KzF1RIFXVP8Oh',
  {
    name: 'ethereum-ambire-earn',
    chainId: 1
  }
)

// @ts-ignore
rpcProviders['ethereum-ambire-swap'] = new providers.StaticJsonRpcProvider(
  'https://unufri-ethereum.adex.network/v3/099fc58e0de9451d80b18d7c74caa7c1',
  {
    name: 'ethereum-ambire-swap',
    chainId: getChainId(NETWORKS.ethereum)
  }
)

// @ts-ignore
rpcProviders['polygon-ambire-swap'] = new providers.StaticJsonRpcProvider(
  'https://unufri-polygon.adex.network/v3/099fc58e0de9451d80b18d7c74caa7c1',
  {
    name: 'polygon-ambire-swap',
    chainId: getChainId(NETWORKS.polygon)
  }
)

// @ts-ignore
rpcProviders['arbitrum-ambire-swap'] = new providers.StaticJsonRpcProvider(
  'https://unufri-arbitrum.adex.network/v3/099fc58e0de9451d80b18d7c74caa7c1',
  {
    name: 'arbitrum-ambire-swap',
    chainId: getChainId(NETWORKS.arbitrum)
  }
)

// @ts-ignore
rpcProviders['optimism-ambire-swap'] = new providers.StaticJsonRpcProvider(
  'https://unufri-optimism.adex.network/v3/099fc58e0de9451d80b18d7c74caa7c1',
  {
    name: 'optimism-ambire-swap',
    chainId: getChainId(NETWORKS.optimism)
  }
)

export { rpcProviders }
