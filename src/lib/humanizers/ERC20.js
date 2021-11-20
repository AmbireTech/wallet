import { abis } from '../../consts/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
import { token, getContractName } from '../humanReadableTransactions'

const iface = new Interface(abis.ERC20)

export default {
  [iface.getSighash('approve')]: (txn, network) => {
    const [ approvedAddress, amount ] = iface.parseTransaction(txn).args
    if (amount.eq(0)) return [`Revoke approval for ${getContractName(approvedAddress, network)} to spend ${getContractName(txn.to, network)}`]
    return [`Approve ${getContractName(approvedAddress, network)} to spend ${token(txn.to, amount)}`]
  },
  [iface.getSighash('transfer')]: (txn, network) => {
    const [ to, amount ] = iface.parseTransaction(txn).args
    return [`Send ${token(txn.to, amount)} to ${getContractName(to, network)}`]
  },
  [iface.getSighash('transferFrom')]: (txn, network) => {
    const [ from, to, amount ] = iface.parseTransaction(txn).args
    return [`Send ${token(txn.to, amount)} from ${getContractName(from, network)} to ${getContractName(to, network)}`]
  },
}
