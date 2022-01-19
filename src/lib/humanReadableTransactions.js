import { formatUnits } from 'ethers/lib/utils'
import { constants } from 'ethers'
import { names, tokens } from 'consts/humanizerInfo'
import networks from 'consts/networks'
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
        return !opts.extended ? `Transaction cancellation` : [[
            'Cancel',
            'transaction'
        ]]
    }

    let callSummary, sendSummary
    if (parseInt(value) > 0) sendSummary = !opts.extended ? `send ${nativeToken(network, value)} to ${name || to}` : [
        'Send',
        {
            type: 'token',
            ...nativeToken(network, value, true),
        },
        'to',
        {
            type: 'address',
            address: to,
            name
        }
    ]

    if (data !== '0x') {
        callSummary = !opts.extended ? `Unknown interaction with ${name || (tokenInfo ? tokenInfo[0] : to)}` : [
            'unknown',
            'interaction with',
            {
                type: 'address',
                address: to,
                name: name || (tokenInfo && tokenInfo[0])
            }
        ]

        const sigHash = data.slice(0, 10)
        const humanizer = humanizers[sigHash]
        if (humanizer) {
            try {
                const actions = humanizer({ to, value, data, from: accountAddr }, network, opts)
                return opts.extended === true ? actions : actions.join(', ')
            } catch (e) {
                callSummary += ' (unable to parse)'
                console.error('internal tx humanization error', e)
            }
        }
    }

    const filteredSummary = [callSummary, sendSummary].filter(x => x)
    return !opts.extended ? filteredSummary.join(', ') : filteredSummary
}

// Currently takes network because one day we may be seeing the same addresses used on different networks
export function getName(addr, network) {
    const address = addr.toLowerCase()
    if (knownAliases[address]) return knownAliases[address]
    return names[address] || (tokens[address] ? tokens[address][0] + ' token' : null) || addr
}

export function token(addr, amount, extended = false) {
    const address = addr.toLowerCase()
    const assetInfo = tokens[address] || knownTokens[address]

    if (assetInfo) {
        const extendedToken = {
            address,
            symbol: assetInfo[0],
            decimals: assetInfo[1],
            amount: null
        }

        if (!amount) return !extended ? assetInfo[0] : extendedToken

        if (constants.MaxUint256.eq(amount)) return !extended ? `maximum ${assetInfo[0]}` : {
            ...extendedToken,
            amount: -1
        }
    
        return !extended ? `${formatUnits(amount, assetInfo[1])} ${assetInfo[0]}` : {
            ...extendedToken,
            amount: formatUnits(amount, assetInfo[1])
        }
    } else {
        return !extended ? `${formatUnits(amount, 0)} units of unknown token` : {
            address,
            symbol: null,
            decimals: null,
            amount: formatUnits(amount, 0)
        }
    }
}

export function nativeToken(network, amount, extended = false) {
    const extendedNativeToken = {
        address: `0x` + '0'.repeat(40),
        symbol: 'unknown native token',
        decimals: 18,
    }

    // All EVM chains use a 18 decimal native asset
    if (network) {
        return !extended ? `${formatUnits(amount, 18)} ${network.nativeAssetSymbol}` : {
            ...extendedNativeToken,
            symbol: network.nativeAssetSymbol,
            amount: formatUnits(amount, 18)
        }
    } else {
        return !extended ? `${formatUnits(amount, 18)} unknown native token` : {
            ...extendedNativeToken,
            amount: formatUnits(amount, 18)
        }
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