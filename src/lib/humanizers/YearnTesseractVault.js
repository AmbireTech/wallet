import { abis, yearnVaults, tesseractVaults } from 'consts/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
import { token } from 'lib/humanReadableTransactions'

const iface = new Interface(abis.YearnVault)

const tokenPrefixes = { ethereum: 'y', polygon: 'tv' }
// add 'y' or 'tv' prefix, eg '10 USDC' will become '10 yUSDC' to signify vault tokens
const addTokenPrefix = (token, network) => token.split(' ').map((x, i) => i === 1 ? tokenPrefixes[network]+x : x).join(' ')
const getVaultInfo = ({ to }) => yearnVaults.find(x => x.addr === to) || tesseractVaults.find(x => x.addr === to)

const YearnTesseractMapping = {
  [iface.getSighash('deposit(uint256,address)')]: (txn, network) => {
    const [ amount ] = iface.parseTransaction(txn).args
    const vaultInfo = getVaultInfo(txn)
    if (vaultInfo) return [`Deposit ${token(vaultInfo.baseToken, amount)} to ${vaultInfo.name}`]
    return [`Deposit ${amount} units to Yearn`]
  },
  [iface.getSighash('withdraw(uint256,address)')]: (txn, network) => {
    const [ amount ] = iface.parseTransaction(txn).args
    const vaultInfo = getVaultInfo(txn)
    if (vaultInfo) return [`Withdraw ${addTokenPrefix(token(vaultInfo.baseToken, amount), vaultInfo.network)} from ${vaultInfo.name}`]
    return [`Withdraw ${amount} units from Yearn`]
  },
}
export default YearnTesseractMapping