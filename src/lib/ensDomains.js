import { getProvider } from './provider.js'
import { normalize } from '@ensdomains/eth-ens-namehash'
import  constants  from 'bip44-constants'
import { ethers } from 'ethers'

const ETH_ID = 'homestead'
const BIP44_Base_Value = 2147483648
const Address_Zero = "0x0000000000000000000000000000000000000000"
const Ens_Domain_Suffix = ".eth"

const provider = getProvider(ETH_ID)

async function resolveENSDomain(domain, bip44Item) {
	const normalizedDomainName = normalize(domain)
	const resolver = await provider.getResolver(normalizedDomainName)
	if(!resolver) return null;
	const ethAddress = await resolver.getAddress();
	const addressForCoin = await resolveForCoin(resolver, bip44Item);
	return isCorrectAddress(addressForCoin) ? addressForCoin : ethAddress

}

async function resolveForCoin(resolver, bip44Item) {
	if (bip44Item) {
		const coinType = getNormalisedCoinType(bip44Item);
		return resolver.getAddress(coinType)
	}
	else {
		return resolver.getAddress();
	}
}

function getBip44Items(coinTicker) {
	if(!coinTicker) return []
	return constants.filter(item => item[1] === coinTicker)
}

function getNormalisedCoinType(bip44Item) {
	return bip44Item[0][0] - BIP44_Base_Value
}

function isCorrectAddress(address) {
	return !(Address_Zero === address) && ethers.utils.isAddress(address)
}

function isEnsDomain(domain) {
	return domain && typeof domain === 'string' && domain.endsWith(Ens_Domain_Suffix)
}

export {
	resolveENSDomain,
	getBip44Items,
	isEnsDomain
}