import { getProvider } from 'ambire-common/src/services/provider'
import { normalize } from '@ensdomains/eth-ens-namehash'
import constants from 'bip44-constants'
import { ethers } from 'ethers'

const ETH_ID = 'ethereum'
const BIP44_BASE_VALUE = 2147483648
const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'

async function resolveENSDomain(domain, bip44Item) {
  const normalizedDomainName = normalizeDomain(domain)
  if (!normalizedDomainName) return null
  const provider = getProvider(ETH_ID)
  const resolver = await provider.getResolver(normalizedDomainName)
  if (!resolver) return null
  const ethAddress = await resolver.getAddress()
  const addressForCoin = await resolveForCoin(resolver, bip44Item).catch((e) => null)
  return isCorrectAddress(addressForCoin) ? addressForCoin : ethAddress
}

const normalizeDomain = (domain) => {
  try {
    return normalize(domain)
  } catch (e) {
    return null
  }
}

async function resolveForCoin(resolver, bip44Item) {
  if (bip44Item && bip44Item.length === 1) {
    const coinType = getNormalisedCoinType(bip44Item)
    if (!coinType) return null
    return resolver.getAddress(coinType)
  }
  return resolver.getAddress()
}

function getBip44Items(coinTicker) {
  if (!coinTicker) return null
  return constants.filter((item) => item[1] === coinTicker)
}

function getNormalisedCoinType(bip44Item) {
  return bip44Item[0].length ? bip44Item[0][0] - BIP44_BASE_VALUE : null
}

function isCorrectAddress(address) {
  return !(ADDRESS_ZERO === address) && ethers.utils.isAddress(address)
}

export { resolveENSDomain, getBip44Items }
