import { Interface } from 'ethers/lib/utils'
import { token, getName, nativeToken } from 'lib/humanReadableTransactions'
import { MdDesktopAccessDisabled } from 'react-icons/md'

const Lido = (humanizerInfo) => {
  const iface = new Interface([
    {
      constant: false,
      inputs: [
        {
          name: '_referral',
          type: 'address'
        }
      ],
      name: 'submit',
      outputs: [],
      payable: true,
      stateMutability: 'payable',
      type: 'function'
    }
  ])
  function getAddress(humanizerInfo, address) {
    return {
      type: 'address',
      address,
      name: getName(humanizerInfo, address)
    }
  }
  return {
    [iface.getSighash('submit')]: (txn, network, { extended }) => {
      const { _positionId, _recipient } = iface.parseTransaction(txn).args
      console.log([
        'Stake',
        {
          type: 'token',
          ...nativeToken(network, txn.value, true)
        },
        'to',
        getAddress(humanizerInfo, txn.to)
      ])
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
    }
  }
}
export default Lido
