import { abis, yearnVaults, tesseractVaults } from 'consts/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
import { token } from 'lib/humanReadableTransactions'

const iface = new Interface(abis.YearnVault)

const vaultNames = { ethereum: 'Yearn', polygon: 'Tesseract' }
const tokenPrefixes = { ethereum: 'y', polygon: 'tv' }
// add 'y' or 'tv' prefix, eg '10 USDC' will become '10 yUSDC' to signify vault tokens
const addTokenPrefix = (token, network) => token.split(' ').map((x, i) => i === 1 ? tokenPrefixes[network]+x : x).join(' ')
const getVaultInfo = ({ to }) => yearnVaults.find(x => x.addr === to) || tesseractVaults.find(x => x.addr === to)

const toExtendedRich = (action, word, vaultInfo, amount) => [[
  action,
  {
    type: 'token',
    ...token(vaultInfo.baseToken, amount, true)
  },
  word,
  {
    type: 'address',
    name: vaultInfo.name,
    address: vaultInfo.addr
  }
]]

const toExtended = (action, word, network, amount) => [[
  action,
  {
    type: 'token',
    symbol: 'units',
    amount: amount.toString()
  },
  word,
  {
    type: 'address',
    name: vaultNames[network.id]
  }
]]

const YearnTesseractMapping = {
  [iface.getSighash('deposit(uint256,address)')]: (txn, network, { extended = false }) => {
    const [ amount ] = iface.parseTransaction(txn).args
    const vaultInfo = getVaultInfo(txn)
    if (vaultInfo) return !extended ? [`Deposit ${token(vaultInfo.baseToken, amount)} to ${vaultInfo.name}`] : toExtendedRich('Deposit', 'to', vaultInfo, amount)
    return !extended ? [`Deposit ${amount} units to ${vaultNames[network.id]}`] : toExtended('Deposit', 'to', network, amount)
  },
  [iface.getSighash('withdraw(uint256,address)')]: (txn, network, { extended = false }) => {
    const [ amount ] = iface.parseTransaction(txn).args
    const vaultInfo = getVaultInfo(txn)
    if (vaultInfo) return !extended ? [`Withdraw ${addTokenPrefix(token(vaultInfo.baseToken, amount), network.id)} from ${vaultInfo.name}`] : toExtendedRich('Withdraw', 'from', vaultInfo, amount)
    return !extended ? [`Withdraw ${amount} units from ${vaultNames[network.id]}`] : toExtended('Withdraw', 'from', network, amount)
  },
}
export default YearnTesseractMapping