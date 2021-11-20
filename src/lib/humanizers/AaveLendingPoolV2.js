import { abis } from '../../consts/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
const iface = new Interface(abis.AaveLendingPoolV2)
const withAbi = fn => ((txn, network) => {
  const { args } = iface.parseTransaction(txn)
  fn(args, txn, network)
})

export default {
  [iface.getSighash('deposit')]: withAbi((args, txn, network) => {
    console.log(args)
  })
}
