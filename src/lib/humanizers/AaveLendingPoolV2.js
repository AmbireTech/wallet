import { abis } from '../../consts/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
import { token } from '../humanReadableTransactions'

const iface = new Interface(abis.AaveLendingPoolV2)

export default {
  [iface.getSighash('deposit')]: (txn, network) => {
    const [ asset, amount ] = iface.parseTransaction(txn).args
    return [`Deposit ${token(asset, amount)} to Aave lending pool`]
  },
  [iface.getSighash('withdraw')]: (txn, network) => {
    const [ asset, amount ] = iface.parseTransaction(txn).args
    return [`Withdraw ${token(asset, amount)} from Aave lending pool`]
  },
}
