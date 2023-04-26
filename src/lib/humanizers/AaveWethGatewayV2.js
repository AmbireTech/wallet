import { Interface } from 'ethers/lib/utils'
import { nativeToken } from 'lib/humanReadableTransactions'

const onBehalfText = (onBehalf, txnFrom) =>
  onBehalf && onBehalf.toLowerCase() !== txnFrom.toLowerCase() ? ` on behalf of ${onBehalf}` : ''

const toExtended = (action, word, token, txn, onBehalf) => {
  return [
    [
      action,
      {
        type: 'token',
        ...token
      },
      word,
      {
        type: 'address',
        address: txn.to,
        name: 'Aave lending pool'
      },
      onBehalf ? onBehalfText(onBehalf, txn.from) : ''
    ]
  ]
}

const AaveMapping = (abis) => {
  const iface = new Interface(abis.AaveWethGatewayV2)

  return {
    [iface.getSighash('depositETH')]: (txn, network, { extended }) => {
      const [, , /* depositETH */ /* lendingPool */ onBehalfOf] = iface.parseTransaction(txn).args
      if (extended)
        return toExtended('Deposit', 'to', nativeToken(network, txn.value, true), txn, onBehalfOf)
      return [
        `Deposit ${nativeToken(network, txn.value)} to Aave lending pool${onBehalfText(
          onBehalfOf,
          txn.from
        )}`
      ]
    },
    [iface.getSighash('withdrawETH')]: (txn, network, { extended }) => {
      const [, /* lendingPool */ amount, to] = iface.parseTransaction(txn).args
      if (extended)
        return toExtended('Withdraw', 'from', nativeToken(network, amount, true), txn, to)
      return [
        `Withdraw ${nativeToken(network, amount)} from Aave lending pool${onBehalfText(
          to,
          txn.from
        )}`
      ]
    },
    [iface.getSighash('repayETH')]: (txn, network, { extended }) => {
      const [, , , , /* repayETH */ /* lendingPool */ /* amount */ /* rateMode */ onBehalfOf] =
        iface.parseTransaction(txn).args
      if (extended)
        return toExtended('Repay', 'to', nativeToken(network, txn.value, true), txn, onBehalfOf)
      return [
        `Repay ${nativeToken(network, txn.value)} to Aave lending pool${onBehalfText(
          onBehalfOf,
          txn.from
        )}`
      ]
    },
    [iface.getSighash('borrowETH')]: (txn, network, { extended }) => {
      const [, /* lendingPool */ amount] = iface.parseTransaction(txn).args
      if (extended) return toExtended('Borrow', 'from', nativeToken(network, amount, true), txn)
      return [`Borrow ${nativeToken(network, amount)} from Aave lending pool`]
    }
  }
}
export default AaveMapping
