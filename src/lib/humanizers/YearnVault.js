import { abis } from '../../consts/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
import { token } from '../humanReadableTransactions'

const iface = new Interface(abis.YearnVault)
console.log(iface);

const YearnMapping = {
  [iface.getSighash('deposit(uint256,address)')]: (txn, network) => {
    const [ amount ] = iface.parseTransaction(txn).args
    return [`Deposit ${amount} to Yearn Vault`]
  },
}
export default YearnMapping