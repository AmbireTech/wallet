import { abis } from 'consts/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
import { nativeToken } from 'lib/humanReadableTransactions'

const iface = new Interface(abis.WETH)
const WETHMapping = {
  [iface.getSighash('deposit')]: (txn, network) => {
    const { value } = iface.parseTransaction(txn)
    return [`Wrap ${nativeToken(network, value)}`]
  },
  [iface.getSighash('withdraw')]: (txn, network) => {
    const [ amount ] = iface.parseTransaction(txn).args
    return [`Unwrap ${nativeToken(network, amount)}`]
  },
}
export default WETHMapping