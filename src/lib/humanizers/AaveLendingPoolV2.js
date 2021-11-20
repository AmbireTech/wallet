import { abis } from '../../consts/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
import { token } from '../humanReadableTransactions'

const iface = new Interface(abis.AaveLendingPoolV2)
const withAbi = fn => ((txn, network) => {
  const { args } = iface.parseTransaction(txn)
  return fn(args, txn, network)
})

export default {
  [iface.getSighash('deposit')]: withAbi((args, txn, network) => {
    const { asset, amount } = args
    return [`Deposit ${token(asset, amount)} to Aave lending pool`]
  })
}
