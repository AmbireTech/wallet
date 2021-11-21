import { abis } from '../../consts/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
import { token } from '../humanReadableTransactions'

const iface = new Interface(abis.AaveLendingPoolV2)
const addrEq = (a, b) => a.toLowerCase() === b.toLowerCase()

export default {
  [iface.getSighash('deposit')]: (txn, network) => {
    const [ asset, amount, onBehalf ] = iface.parseTransaction(txn).args
    return [`Deposit ${token(asset, amount)} to Aave lending pool${!addrEq(onBehalf, txn.from) ? ' on behalf of '+onBehalf : ''}`]
  },
  [iface.getSighash('withdraw')]: (txn, network) => {
    const [ asset, amount, onBehalf ] = iface.parseTransaction(txn).args
    return [`Withdraw ${token(asset, amount)} from Aave lending pool${!addrEq(onBehalf, txn.from) ? ' on behalf of '+onBehalf : ''}`]
  },
  [iface.getSighash('repay')]: (txn, network) => {
    const [ asset, amount, onBehalf ] = iface.parseTransaction(txn).args
    return [`Repay ${token(asset, amount)} to Aave lending pool${!addrEq(onBehalf, txn.from) ? ' on behalf of '+onBehalf : ''}`]
  },
}
