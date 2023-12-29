import { Interface } from 'ethers/lib/utils'
import { token, getName, nativeToken } from 'lib/humanReadableTransactions'
import { MdDesktopAccessDisabled } from 'react-icons/md'

const MATIC_ON_ETH_ADDRESS = '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0'
const Lido = (humanizerInfo) => {
  const ifaceETH = new Interface(humanizerInfo.abis.LidoStETH)
  const ifaceMATIC = new Interface(humanizerInfo.abis.LidoStMATIC)
  function getAddress(humanizerInfo, address) {
    return {
      type: 'address',
      address,
      name: getName(humanizerInfo, address)
    }
  }
  // 0x7c9f4c87d911613fe9ca58b579f737911aad2d43
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
    }
  }
}
export default Lido
