import { abis } from 'consts/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
import { nativeToken } from 'lib/humanReadableTransactions'

const toExtended = (action, network, amount) => {
  return [[
      action,
      {
        type: 'token',
        ...nativeToken(network, amount, true)
      }
    ]]
}

const iface = new Interface(abis.WETH)
const WETHMapping = {
  [iface.getSighash('deposit')]: (txn, network, { extended = false }) => {
    const { value } = iface.parseTransaction(txn)
    return !extended ? [`Wrap ${nativeToken(network, value)}`] : toExtended('Wrap', network, value)
  },
  [iface.getSighash('withdraw')]: (txn, network, { extended = false }) => {
    const [ amount ] = iface.parseTransaction(txn).args
    return !extended ? [`Unwrap ${nativeToken(network, amount)}`] : toExtended('Unwrap', network, amount)
  },
}
export default WETHMapping