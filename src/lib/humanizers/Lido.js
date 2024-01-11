import { Interface } from 'ethers/lib/utils'
import { token, getName, nativeToken } from 'lib/humanReadableTransactions'

function getAddress(humanizerInfo, address) {
  return {
    type: 'address',
    address,
    name: getName(humanizerInfo, address)
  }
}
const MATIC_ON_ETH_ADDRESS = '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0'
const Lido = (humanizerInfo) => {
  const ifaceETH = new Interface(humanizerInfo.abis.LidoStETH)
  const ifaceMATIC = new Interface(humanizerInfo.abis.LidoStMATIC)
  const unstIfaceETH = new Interface(humanizerInfo.abis.unstETH)

  return {
    [ifaceETH.getSighash('submit')]: (txn, network, { extended }) => {
      const { _positionId, _recipient } = ifaceETH.parseTransaction(txn).args
      if (extended)
        return [
          _recipient === txn.from
            ? [`Stake ${nativeToken(network, txn.value)}`]
            : [
                'Stake',
                {
                  type: 'token',
                  ...nativeToken(network, txn.value, true)
                },
                'to',
                getAddress(humanizerInfo, txn.to)
              ]
        ]
      return [
        _recipient === txn.from
          ? [`Withdraw swapped tokens from position ${_positionId}`]
          : [`Send swapped tokens from position ${_positionId} to ${_recipient}`]
      ]
    },
    [ifaceMATIC.getSighash('submit')]: (txn, network, { extended }) => {
      const { _amount } = ifaceMATIC.parseTransaction(txn).args
      if (extended)
        return [
          ['Stake', { type: 'token', ...token(humanizerInfo, MATIC_ON_ETH_ADDRESS, _amount, true) }]
        ]
      return [[`Stake ${token(humanizerInfo, MATIC_ON_ETH_ADDRESS, _amount)}`]]
    },
    [unstIfaceETH.getSighash('requestWithdrawals(uint256[],address)')]: (
      txn,
      network,
      { extended }
    ) => {
      const { _amounts, _owner } = unstIfaceETH.parseTransaction(txn).args
      if (extended) {
        return _owner === txn.from || _owner === '0x0000000000000000000000000000000000000000'
          ? [
              'Request',
              'withdrawal from',
              { type: 'address', address: txn.to, name: getName(txn.to) }
            ]
          : [
              'Request',
              'withdrawal from',
              { type: 'address', address: txn.to, name: getName(txn.to) },
              'for',
              { type: 'address', address: _owner, name: getName(_owner) }
            ]
      }
      return [
        _owner === txn.from || _owner === ethers.constants.AddressZero
          ? [`Request withdrawal from ${getName(txn.to)}`]
          : [`Request withdrawal from ${getName(txn.to)} for ${_owner}`]
      ]
    }
  }
}
export default Lido
