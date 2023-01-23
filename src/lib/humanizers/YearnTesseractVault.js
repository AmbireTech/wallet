import { Interface } from 'ethers/lib/utils'
import { token } from 'lib/humanReadableTransactions'

const vaultNames = { ethereum: 'Yearn', polygon: 'Tesseract', fantom: 'Yearn' }
const tokenPrefixes = { ethereum: 'y', polygon: 'tv' }
// add 'y' or 'tv' prefix, eg '10 USDC' will become '10 yUSDC' to signify vault tokens
const addTokenPrefix = (token, network) => token.split(' ').map((x, i) => i === 1 ? tokenPrefixes[network]+x : x).join(' ')

const toExtendedRich = (humanizerInfo, action, word, vaultInfo, amount) => [[
  action,
  {
    type: 'token',
    ...token(humanizerInfo, vaultInfo.baseToken, amount, true)
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

const YearnTesseractMapping = (humanizerInfo) => {
  const { abis, yearnVaults, tesseractVaults } = humanizerInfo
  const iface = new Interface(abis.YearnVault)
  const getVaultInfo = ({ to }) => yearnVaults.find(x => x.addr === to) || tesseractVaults.find(x => x.addr === to)

  return {
    [iface.getSighash('deposit(uint256,address)')]: (txn, network, { extended = false }) => {
      const [ amount ] = iface.parseTransaction(txn).args
      const vaultInfo = getVaultInfo(txn)
      if (vaultInfo) return !extended ? [`Deposit ${token(humanizerInfo, vaultInfo.baseToken, amount)} to ${vaultInfo.name}`] : toExtendedRich(humanizerInfo, 'Deposit', 'to', vaultInfo, amount)
      return !extended ? [`Deposit ${amount} units to ${vaultNames[network.id]}`] : toExtended('Deposit', 'to', network, amount)
    },
    [iface.getSighash('withdraw(uint256,address)')]: (txn, network, { extended = false }) => {
      const [ amount ] = iface.parseTransaction(txn).args
      const vaultInfo = getVaultInfo(txn)
      if (vaultInfo) return !extended ? [`Withdraw ${addTokenPrefix(token(humanizerInfo, vaultInfo.baseToken, amount), network.id)} from ${vaultInfo.name}`] : toExtendedRich(humanizerInfo, 'Withdraw', 'from', vaultInfo, amount)
      return !extended ? [`Withdraw ${amount} units from ${vaultNames[network.id]}`] : toExtended('Withdraw', 'from', network, amount)
    },
  }
}
export default YearnTesseractMapping