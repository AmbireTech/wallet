import { abis } from '../../consts/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
import { token } from '../humanReadableTransactions'

const iface = new Interface(abis.AaveLendingPoolV2)
const onBehalfText = (onBehalf, txnFrom) => onBehalf.toLowerCase() !== txnFrom.toLowerCase()
  ? ' on behalf of '+onBehalf
  : ''

export default {
  [iface.getSighash('deposit')]: (txn, network) => {
    const [ asset, amount, onBehalf ] = iface.parseTransaction(txn).args
    return [`Deposit ${token(asset, amount)} to Aave lending pool${onBehalfText(onBehalf, txn.from)}`]
  },
  [iface.getSighash('withdraw')]: (txn, network) => {
    const [ asset, amount, onBehalf ] = iface.parseTransaction(txn).args
    return [`Withdraw ${token(asset, amount)} from Aave lending pool${onBehalfText(onBehalf, txn.from)}`]
  },
  [iface.getSighash('repay')]: (txn, network) => {
    const [ asset, amount, onBehalf ] = iface.parseTransaction(txn).args
    return [`Repay ${token(asset, amount)} to Aave lending pool$${onBehalfText(onBehalf, txn.from)}`]
  },
}
