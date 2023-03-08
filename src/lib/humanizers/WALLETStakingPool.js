import { Interface, parseUnits } from 'ethers/lib/utils'
import { token } from 'lib/humanReadableTransactions'
import WalletStakingPoolABI from 'ambire-common/src/constants/abis/WalletStakingPoolABI.json'

const STAKING_POOLS = {
  '0x47cd7e91c3cbaaf266369fe8518345fc4fc12935': {
    baseToken: '0x88800092ff476844f74dc2fc427974bbee2794ae',
    name: 'WALLET Staking Pool'
  },
  '0xb6456b57f03352be48bf101b46c1752a0813491a': {
    baseToken: '0xade00c28244d5ce17d72e40330b1c318cd12b7c3',
    name: 'ADX Staking Pool'
  },
  //this is on polygon for tests
  '0xec3b10ce9cabab5dbf49f946a623e294963fbb4e': {
    baseToken: '0xe9415e904143e42007865e6864f7f632bd054a08',
    name: 'WALLET Staking Pool (Test)'
  }
}
const WALLET_TOKEN_ADDR = '0x88800092ff476844f74dc2fc427974bbee2794ae'

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
      name: STAKING_POOLS[txn.to].name
    }
  ]]
}

const WALLETStakingPool = (humanizerInfo) => {
  const iface = new Interface(WalletStakingPoolABI)
  return {
    [iface.getSighash('enter')]: (txn, network, { extended = false }) => {
      const { amount } = iface.parseTransaction(txn).args
      if (extended) return toExtended('Deposit', 'to', token(humanizerInfo, STAKING_POOLS[txn.to].baseToken, amount, true), txn)
      return [`Deposit ${token(humanizerInfo, STAKING_POOLS[txn.to].baseToken, amount)} to ${STAKING_POOLS[txn.to].name}`]
    },
    [iface.getSighash('leave')]: (txn, network, { extended = false }) => {
      if (extended) return [['Leave', 'from', {
        type: 'address',
        address: txn.to,
        name: STAKING_POOLS[txn.to].name
      }]]
      return [`Leave the WALLET Staking Pool`]
    },
    [iface.getSighash('withdraw')]: (txn, network, opts) => {
      const { shares } = iface.parseTransaction(txn).args
      let params = {
          amount: shares,
          tokenAddr: txn.to,
      }
      // If walletValue prop is passed via the metadata we show wallet amount for the txn humanizer
      // Otherwise we use xWallet as default value for amount
      if (opts.meta && opts.meta.xWallet && opts.meta.xWallet.walletValue) {
          params = {
              amount: parseUnits(opts.meta.xWallet.walletValue, 18),
              tokenAddr: WALLET_TOKEN_ADDR,
          }
      }

      if (opts.extended) return toExtended('Withdraw', 'from', token(humanizerInfo, params.tokenAddr, params.amount, true), txn)
      return [`Withdraw ${token(humanizerInfo, params.tokenAddr, params.amount)} to ${STAKING_POOLS[txn.to].name}`]
    },
    [iface.getSighash('rageLeave')]: (txn, network, { extended = false }) => {
      const { shares } = iface.parseTransaction(txn).args
      if (extended) return toExtended('Rage Leave', 'from', token(humanizerInfo, txn.to, shares, true), txn)
      return [`Rage Leave ${token(humanizerInfo, txn.to, shares)} to ${STAKING_POOLS[txn.to].name}`]
    },
  }
}
export default WALLETStakingPool
