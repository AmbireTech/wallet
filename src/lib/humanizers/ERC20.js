import { abis } from '../../consts/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
import { token, getContractName } from '../humanReadableTransactions'

const iface = new Interface(abis.ERC20)

export default {
  [iface.getSighash('approve')]: (txn, network) => {
    const [ approvedAddress, amount ] = iface.parseTransaction(txn).args
    return [`Approve ${getContractName(approvedAddress, network)} to spend ${token(txn.to, amount)}`]
  },
  [iface.getSighash('transfer')]: (txn, network) => {
    const [ to, amount ] = iface.parseTransaction(txn).args
    return [`Send ${token(txn.to, amount)} to ${getContractName(to, network)}`]
  },
}
