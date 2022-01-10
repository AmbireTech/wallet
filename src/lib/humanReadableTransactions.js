import { formatUnits } from 'ethers/lib/utils'
import { constants } from 'ethers'
import { names, tokens } from '../consts/humanizerInfo'
import networks from '../consts/networks'
import humanizers from './humanizers'

// address (lwoercase) => name
const knownAliases = {}
// address (lowercase) => [symbol, decimals]
const knownTokens = {}

export const formatNativeTokenAddress = address => address.toLowerCase() === `0x${'e'.repeat(40)}` ? `0x${'0'.repeat(40)}` : address.toLowerCase()

export function getTransactionSummary(txn, networkId, accountAddr, opts = {}) {
    const [to, value, data = '0x'] = txn
    const network = networks.find(x => x.id === networkId || x.chainId === networkId)
    if (!network) return 'Unknown network (unable to parse)'

    if (to === '0x' || !to) {
        return 'Deploy contract'
    }

    const tokenInfo = tokens[to.toLowerCase()]
    const name = names[to.toLowerCase()]

    if (data === '0x' && to.toLowerCase() === accountAddr.toLowerCase()) {
        // Doesn't matter what the value is, this is always a no-op
        return `Transaction cancellation`
    }

    let callSummary, sendSummary
    if (parseInt(value) > 0) sendSummary = `send ${nativeToken(network, value)} to ${name || to}`
    if (data !== '0x') {
        callSummary = `Unknown interaction with ${name || (tokenInfo ? tokenInfo[0] : to)}`

        const sigHash = data.slice(0, 10)
        const humanizer = humanizers[sigHash]
        if (humanizer) {
            try {
                const actions = humanizer({ to, value, data, from: accountAddr }, network, opts)
                return actions.join(', ')
            } catch (e) {
                callSummary += ' (unable to parse)'
                console.error('internal tx humanization error', e)
            }
        }
    }
    return [callSummary, sendSummary].filter(x => x).join(', ')
}

// Currently takes network because one day we may be seeing the same addresses used on different networks
export function getName(addr, network) {
    const address = addr.toLowerCase()
    if (knownAliases[address]) return knownAliases[address]
    return names[address] || (tokens[address] ? tokens[address][0] + ' token' : null) || addr
}

export function token(addr, amount) {
    const address = addr.toLowerCase()
    const assetInfo = tokens[address] || knownTokens[address]
    if (assetInfo) {
        if (!amount) return assetInfo[0]
        if (constants.MaxUint256.eq(amount)) return `maximum ${assetInfo[0]}`
        return `${formatUnits(amount, assetInfo[1])} ${assetInfo[0]}`
    } else {
        return `${formatUnits(amount, 0)} units of unknown token`
    }
}

export function nativeToken(network, amount) {
    // All EVM chains use a 18 decimal native asset
    if (network) {
        return `${formatUnits(amount, 18)} ${network.nativeAssetSymbol}`
    } else {
        return `${formatUnits(amount, 18)} unknown native token`
    }
}

export function setKnownAddresses(addrs) {
    addrs.forEach(({ address, name }) => knownAliases[address.toLowerCase()] = name)
}

export function setKnownTokens(tokens) {
    tokens.forEach(({ address, symbol, decimals }) => knownTokens[address.toLowerCase()] = [symbol, decimals])
}

export function isKnown(txn, from) {
    if (txn[0] === from) return true
    const address = txn[0].toLowerCase()
    return !!(knownAliases[address] || names[address] || tokens[address] || knownTokens[address])
}

export {
    knownAliases,
    knownTokens
}

// @TODO
// export function getMethodName(txn)