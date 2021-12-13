import { abis } from '../../consts/humanizerInfo'
import { Interface } from 'ethers/lib/utils'

const iface = new Interface(abis.YearnVault)

const YearnMapping = {
  [iface.getSighash('deposit(uint256,address)')]: (txn, network) => {
    const [ amount ] = iface.parseTransaction(txn).args
    return [`Deposit ${amount} to Yearn Vault`]
  },
  [iface.getSighash('withdraw(uint256,address)')]: (txn, network) => {
    const [ amount ] = iface.parseTransaction(txn).args
    return [`Withdraw ${amount} from Yearn Vault`]
  },
}
export default YearnMapping