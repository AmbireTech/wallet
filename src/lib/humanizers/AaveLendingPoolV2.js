import { abis } from 'consts/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
import { token } from 'lib/humanReadableTransactions'

const iface = new Interface(abis.AaveLendingPoolV2)
const onBehalfText = (onBehalf, txnFrom) => onBehalf.toLowerCase() !== txnFrom.toLowerCase()
  ? ' on behalf of '+onBehalf
  : ''

const toExtended = (action, word, token, onBehalf, txn) => {
  return [
    action,
    {
      type: 'token',
      ...token
    },
    word,
    {
      type: 'address',
      address: txn.to,
      name: 'Aave Lending Pool'
    },
    onBehalfText(onBehalf, txn.from)
  ]
}

const AaveMapping = {
  [iface.getSighash('deposit')]: (txn, network, { extended }) => {
    const [ asset, amount, onBehalf ] = iface.parseTransaction(txn).args
    if (extended) return toExtended('Deposit', 'to', token(asset, amount, true), onBehalf, txn)
    return [`Deposit ${token(asset, amount)} to Aave lending pool${onBehalfText(onBehalf, txn.from)}`]
  },
  [iface.getSighash('withdraw')]: (txn, network, { extended }) => {
    const [ asset, amount, onBehalf ] = iface.parseTransaction(txn).args
    if (extended) return toExtended('Withdraw', 'from', token(asset, amount, true), onBehalf, txn)
    return [`Withdraw ${token(asset, amount)} from Aave lending pool${onBehalfText(onBehalf, txn.from)}`]
  },
  [iface.getSighash('repay')]: (txn, network) => {
    const [ asset, amount, onBehalf ] = iface.parseTransaction(txn).args
    return [`Repay ${token(asset, amount)} to Aave lending pool${onBehalfText(onBehalf, txn.from)}`]
  },
  [iface.getSighash('borrow')]: (txn, network) => {
    const [ asset, amount ] = iface.parseTransaction(txn).args
    return [`Borrow ${token(asset, amount)} from Aave lending pool`]
  },
}
export default AaveMapping