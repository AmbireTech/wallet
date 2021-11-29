import { formatUnits } from 'ethers/lib/utils'
import { constants } from 'ethers'
import { names, tokens } from '../consts/humanizerInfo'
import networks from '../consts/networks'
import humanizers from './humanizers'
const getSummary = require('humanizetx/HumanizeSummary')
const BigNumber = require('bignumber.js')

// address (lwoercase) => name
const knownAliases = {}

export function getTransactionSummary(txn, networkId, accountAddr, opts = {}) {

    const [to, value, data = '0x'] = txn
    const summary = getSummary({id:networkId}, {
        from: accountAddr,
        value: new BigNumber(value).toFixed(0),
        data,
        to
    })
    if(summary?.summaries?.actions?.length){
        console.log(summary.summaries.actions.map(a => a.plain))
        return summary.summaries.actions.map(a => a.plain).join(', ')
    }
    return 'Unable to parse tx'
}

// Currently takes network because one day we may be seeing the same addresses used on different networks
export function getName(addr, network) {
    const address = addr.toLowerCase()
    if (knownAliases[address]) return `${knownAliases[address]} (${addr})`
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

export function setKnownAddresses(addrs) {
    addrs.forEach(({ address, name }) => knownAliases[address.toLowerCase()] = name)
}

// @TODO
// export function getMethodName(txn)
