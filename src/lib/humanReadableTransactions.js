import { Interface, getAddress, formatUnits } from 'ethers/lib/utils'

import { verifiedContracts, tokens } from '../consts/verifiedContracts'
import networks from '../consts/networks'
import ERC20ABI from 'adex-protocol-eth/abi/ERC20'
import AAVELENDINGPOOLABI from '../consts/AAVELendingPoolAbi'

const ERC20 = new Interface(ERC20ABI)
const AAVE = new Interface(AAVELENDINGPOOLABI)
const TRANSFER_SIGHASH = ERC20.getSighash(ERC20.getFunction('transfer').format())
const APPROVE_SIGHASH = ERC20.getSighash(ERC20.getFunction('approve').format())
const AAVE_DEPOSIT_SIGHASH = AAVE.getSighash(AAVE.getFunction('deposit').format())
const AAVE_WITHDRAW_SIGHASH = AAVE.getSighash(AAVE.getFunction('withdraw').format())

// @TODO custom parsing for univ2 contracts, exact output, etc.
export function getTransactionSummary(txn, networkId, accountAddr) {
    const [, value, data] = txn
    const to = getAddress(txn[0])
    let callSummary, sendSummary
    const network = networks.find(x => x.id === networkId || x.chainId === networkId)
    if (!network) return 'Unknown network (unable to parse)'

    const contractKey = network.id + ':' + getAddress(to)
    const contractInfo = verifiedContracts[contractKey]
    const tokenInfo = tokens[to]

    const nativeAsset = network ? network.nativeAssetSymbol : 'unknown native token'
    if (parseInt(value) > 0) sendSummary = `send ${(parseInt(value)/1e18).toFixed(4)} ${nativeAsset} to ${contractInfo ? contractInfo.name : to}`
    if (data !== '0x') {
        if (data.startsWith(TRANSFER_SIGHASH)) {
            const [to, amount] = ERC20.decodeFunctionData('transfer', data)
            if (tokenInfo) {
                callSummary = `send ${(amount/Math.pow(10, tokenInfo[1])).toFixed(4)} ${tokenInfo[0]} to ${to}`
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
        } else if (data.startsWith(APPROVE_SIGHASH)) {
            const [tokenAddress, amount] = ERC20.decodeFunctionData('approve', data)
            if (tokenInfo) {
                callSummary = `Approve sending ${(amount / Math.pow(10, tokenInfo[1])).toFixed(4)} ${tokenInfo[0]} to ${tokenAddress}`
            } else {
                callSummary = `Approve sending ${amount / 1e18} unknown token to ${tokenAddress}`
            }
        } else if (data.startsWith(AAVE_DEPOSIT_SIGHASH)) {
            const [asset, amount] = AAVE.decodeFunctionData('deposit', data)
            const assetInfo = tokens[asset]
            if (assetInfo) {
                callSummary = `Deposit ${(amount / Math.pow(10, assetInfo[1])).toFixed(4)} ${assetInfo[0]} to AAVE Lending Pool`
            } else {
                callSummary = `Deposit ${amount / 1e18} unknown token to AAVE Lending Pool`
            }
        } else if (data.startsWith(AAVE_WITHDRAW_SIGHASH)) {
            const [asset, amount] = AAVE.decodeFunctionData('withdraw', data)
            const assetInfo = tokens[asset]
            if (assetInfo) {
                callSummary = `Withdraw ${(amount / Math.pow(10, assetInfo[1])).toFixed(4)} ${assetInfo[0]} from AAVE Lending Pool`
            } else {
                callSummary = `Withdraw ${amount / 1e18} unknown token from AAVE Lending Pool`
            }
        } else callSummary = `unknown call to ${contractInfo ? contractInfo.name : (tokenInfo ? tokenInfo[0] : to)}`
    }
    return [callSummary, sendSummary].filter(x => x).join(', ')
}

export function getContractName(txn, networkId) {
    const [to] = txn
    const network = networks.find(x => x.id === networkId || x.chainId === networkId)
    const contractKey = network.id + ':' + getAddress(to)
    const contractInfo = verifiedContracts[contractKey]
    return contractInfo ? contractInfo.name : null
}
