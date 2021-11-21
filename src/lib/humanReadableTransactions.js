import { formatUnits } from 'ethers/lib/utils'
import { constants } from 'ethers'
import { names, tokens } from '../consts/humanizerInfo'
import networks from '../consts/networks'
import humanizers from './humanizers'

// @TODO custom parsing for univ2 contracts, exact output, etc.
export function getTransactionSummary(txn, networkId, accountAddr) {
    const [to, value, data] = txn
    const network = networks.find(x => x.id === networkId || x.chainId === networkId)
    if (!network) return 'Unknown network (unable to parse)'

    const tokenInfo = tokens[to.toLowerCase()]
    const name = names[to.toLowerCase()]

    let callSummary, sendSummary
    if (parseInt(value) > 0) sendSummary = `sending ${nativeToken(network, value)} to ${name || to}`
    if (data !== '0x') {
        callSummary = `Unknown interaction with ${name || (tokenInfo ? tokenInfo[0] : to)}`

        const sigHash = data.slice(0, 10)
        const humanizer = humanizers[sigHash]
        if (humanizer) {
            try {
                const actions = humanizer({ to, value, data, from: accountAddr }, network)
                return actions.join(', ')
            } catch (e) {
                console.error('internal tx humanization error', e)
            }
        }
    }
    return [callSummary, sendSummary].filter(x => x).join(', ')
}

export function getContractName(addr/*, networkId*/) {
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