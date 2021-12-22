import { abis, tesseractVaults } from '../../consts/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
import { token } from '../humanReadableTransactions'

const iface = new Interface(abis.TesseractVault)

// add 'y' prefix, eg '10 USDC' will become '10 yUSDC' to signify vault tokens
const addY = x => x.split(' ').map((x, i) => i === 1 ? 'tv'+x : x).join(' ')

const YearnMapping = {
  [iface.getSighash('deposit(uint256,address)')]: (txn, network) => {
    const [ amount ] = iface.parseTransaction(txn).args
    const vaultInfo = tesseractVaults.find(x => x.addr === txn.to)
    if (vaultInfo) return [`Deposit ${token(vaultInfo.baseToken, amount)} to ${vaultInfo.name}`]
    return [`Deposit ${amount} units to Yearn`]
  },
  [iface.getSighash('withdraw(uint256,address)')]: (txn, network) => {
    const [ amount ] = iface.parseTransaction(txn).args
    const vaultInfo = tesseractVaults.find(x => x.addr === txn.to)
    if (vaultInfo) return [`Withdraw ${addY(token(vaultInfo.baseToken, amount))} from ${vaultInfo.name}`]
    return [`Withdraw ${amount} units from Yearn`]
  },
}
export default YearnMapping