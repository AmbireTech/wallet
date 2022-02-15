import { Interface } from 'ethers/lib/utils'
import { token } from 'lib/humanReadableTransactions'
import WalletStakingPoolABI from 'consts/WalletStakingPoolABI'

const WALLET_TOKEN_ADDRESS = '0x88800092ff476844f74dc2fc427974bbee2794ae'
const WALLET_STAKING_ADDRESS = '0x4d3348aa74ba11a2722ea9adec6bc10e92fe3d58'

const iface = new Interface(WalletStakingPoolABI)

const toExtended = (action, word, token, txn) => {
  return [[
    action,
    {
      type: 'token',
      ...token
    },
    word,
    {
      type: 'address',
      address: txn.to,
      name: 'WALLET Staking Pool'
    }
  ]]
}

const WALLETStakingPool = {
  [iface.getSighash('enter')]: (txn, network, { extended = false }) => {
    const { amount } = iface.parseTransaction(txn).args
    if (extended) return toExtended('Deposit', 'to', token(WALLET_TOKEN_ADDRESS, amount, true), txn)
    return [`Deposit ${token(WALLET_TOKEN_ADDRESS, amount)} to WALLET Staking Pool`]
  },
  [iface.getSighash('leave')]: (txn, network, { extended = false }) => {
    const { shares } = iface.parseTransaction(txn).args
    if (extended) return toExtended('Withdraw', 'from', token(WALLET_STAKING_ADDRESS, shares, true), txn)
    return [`Withdraw ${token(WALLET_STAKING_ADDRESS, shares)} to WALLET Staking Pool`]
  },
  [iface.getSighash('rageLeave')]: (txn, network, { extended = false }) => {
    const { shares } = iface.parseTransaction(txn).args
    if (extended) return toExtended('Rage Leave', 'from', token(WALLET_STAKING_ADDRESS, shares, true), txn)
    return [`Rage Leave ${token(WALLET_STAKING_ADDRESS, shares)} to WALLET Staking Pool`]
  },
}
export default WALLETStakingPool
