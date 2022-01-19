import { abis } from 'consts/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
import { token } from 'lib/humanReadableTransactions'

const iface = new Interface(abis.AaveLendingPoolV2)
const onBehalfText = (onBehalf, txnFrom) => onBehalf.toLowerCase() !== txnFrom.toLowerCase()
  ? ' on behalf of '+onBehalf
  : ''

const toExtended = (action, word, token, txn, onBehalf) => {
  return [[
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
    onBehalf ? onBehalfText(onBehalf, txn.from) : ''
  ]]
}

const AaveMapping = {
  [iface.getSighash('deposit')]: (txn, network, { extended }) => {
    const [ asset, amount, onBehalf ] = iface.parseTransaction(txn).args
    if (extended) return toExtended('Deposit', 'to', token(asset, amount, true), txn, onBehalf)
    return [`Deposit ${token(asset, amount)} to Aave lending pool${onBehalfText(onBehalf, txn.from)}`]
  },
  [iface.getSighash('withdraw')]: (txn, network, { extended }) => {
    const [ asset, amount, onBehalf ] = iface.parseTransaction(txn).args
    if (extended) return toExtended('Withdraw', 'from', token(asset, amount, true), txn, onBehalf)
    return [`Withdraw ${token(asset, amount)} from Aave lending pool${onBehalfText(onBehalf, txn.from)}`]
  },
  [iface.getSighash('repay')]: (txn, network, { extended }) => {
    const [ asset, amount, onBehalf ] = iface.parseTransaction(txn).args
    if (extended) return toExtended('Repay', 'to', token(asset, amount, true), txn, onBehalf)
    return [`Repay ${token(asset, amount)} to Aave lending pool${onBehalfText(onBehalf, txn.from)}`]
  },
  [iface.getSighash('borrow')]: (txn, network, { extended }) => {
    const [ asset, amount ] = iface.parseTransaction(txn).args
    if (extended) return toExtended('Borrow', 'from', token(asset, amount, true), txn)
    return [`Borrow ${token(asset, amount)} from Aave lending pool`]
  },
}
export default AaveMapping