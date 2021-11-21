import { formatUnits } from 'ethers/lib/utils'
import { constants } from 'ethers'
import { names, tokens } from '../consts/humanizerInfo'
import networks from '../consts/networks'
import humanizers from './humanizers'

export function getTransactionSummary(txn, networkId, accountAddr) {
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
                const actions = humanizer({ to, value, data, from: accountAddr }, network)
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
export function getContractName(addr, network) {
    const address = addr.toLowerCase()
    return names[address] || (tokens[address] ? tokens[address][0] + ' token' : null) || addr
}

export function token(addr, amount) {
    const address = addr.toLowerCase()
    const assetInfo = tokens[address]
    if (assetInfo) {
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

// @TODO
// export function getMethodName(txn)