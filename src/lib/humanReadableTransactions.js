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
    const nativeAsset = network ? network.nativeAssetSymbol : 'unknown native token'
    if (parseInt(value) > 0) sendSummary = `send ${formatUnits(value, 18)} ${nativeAsset} to ${name || to}`
    if (data !== '0x') {
        if (false) {
        }
        /*if (data.startsWith(TRANSFER_SIGHASH)) {
            const [to, amount] = ERC20.decodeFunctionData('transfer', data)
            if (tokenInfo) {
                callSummary = `send ${(amount/Math.pow(10, tokenInfo[1])).toFixed(4)} ${tokenInfo[0]} to ${name || to}`
            } else {
                // @TODO: maybe we can call the contract and get detailed data
                callSummary = `send ${amount/1e18} unknown token to ${to}`
            }
        } else if (contractInfo) {
            const iface = new Interface(contractInfo.abi)
            const parsed = iface.parseTransaction({ data, value })
            // @TODO: some elegant way to try-catch potential issues here
            if (parsed.name === 'swapExactETHForTokens') {
                const tokenAddr = parsed.args.path[parsed.args.path.length - 1]
                const output = tokenInfo ? `${formatUnits(parsed.args.amountOutMin, tokenInfo[1])} ${tokenInfo[0]}` : `${parsed.args.amountOutMin} of token ${tokenAddr}`
                const contractNote = ` on ${contractInfo.name}`
                const recipientNote = parsed.args.to.toLowerCase() === accountAddr.toLowerCase() ? `` : ` and send it to ${parsed.args.to}`
                return `Swap ${formatUnits(value, 18)} ${nativeAsset} for at least ${output}${contractNote}${recipientNote}`
            } else {
                callSummary = `Interaction with ${contractInfo.name}: ${parsed.name}`
            }
        } */ else {
            // @TODO refactor this whole callSummary thing with returns, will be way more elegant
            callSummary = `unknown call to ${name || (tokenInfo ? tokenInfo[0] : to)}`

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