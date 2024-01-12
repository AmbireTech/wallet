import { Interface } from 'ethers/lib/utils'
import { token, getName } from 'lib/humanReadableTransactions'

export function getInterval(seconds) {
  if (seconds <= 60) return `${seconds} seconds`
  if (seconds <= 60 * 60) return `${seconds / 60} minutes`
  if (seconds <= 60 * 60 * 24) return `${seconds / 60 / 60} hours`
  if (seconds <= 60 * 60 * 24 * 7) return `${seconds / 60 / 60 / 24} days`
  return `${seconds / 60 / 60 / 24 / 7} weeks`
}
function getAddress(humanizerInfo, address) {
  return {
    type: 'address',
    address,
    name: getName(humanizerInfo, address)
  }
}

const MeanFinance = (humanizerInfo) => {
  const iface = new Interface(humanizerInfo.abis.MeanFinance)

  return {
    [iface.getSighash(
      'deposit(address,address,uint256,uint32,uint32,address,(address,uint8[])[])'
    )]: (txn, network, { extended }) => {
      const { _from, _to, _amountOfSwaps, _swapInterval, _owner, _permissions, _amount } =
        iface.parseTransaction(txn).args
      if (extended)
        return [
          [
            'Swap',
            {
              type: 'token',
              ...token(humanizerInfo, _from, _amount, true)
            },
            'for',
            {
              type: 'token',
              ...token(humanizerInfo, _to, 0, true)
            },
            `Split into ${_amountOfSwaps} swaps over ${getInterval(
              _swapInterval * _amountOfSwaps
            )}`,
            'via',
            {
              type: 'address',
              address: txn.to,
              name: getName(humanizerInfo, txn.to)
            }
          ]
        ]
      return [
        `Swap ${token(humanizerInfo, _from, _amount)} for ${getName(
          humanizerInfo,
          _to
        )} Split into ${_amountOfSwaps} swaps over ${getInterval(
          _swapInterval * _amountOfSwaps
        )} via ${txn.to}`
      ]
    },
    [iface.getSighash(
      'deposit(address,address,uint256,uint32,uint32,address,(address,uint8[])[],bytes)'
    )]: (txn, network, { extended }) => {
      const { _from, _to, _amountOfSwaps, _swapInterval, _owner, _permissions, _amount } =
        iface.parseTransaction(txn).args
      if (extended)
        return [
          [
            'Swap',
            {
              type: 'token',
              ...token(humanizerInfo, _from, _amount, true)
            },
            'for',
            {
              type: 'token',
              ...token(humanizerInfo, _to, 0, true)
            },
            `Split into ${_amountOfSwaps} swaps over ${getInterval(
              _swapInterval * _amountOfSwaps
            )}`,
            'via',
            {
              type: 'address',
              address: txn.to,
              name: getName(humanizerInfo, txn.to)
            }
          ]
        ]
      return [
        `Swap ${token(humanizerInfo, _from, _amount)} for ${getName(
          humanizerInfo,
          _to
        )} Split into ${_amountOfSwaps} swaps over ${getInterval(
          _swapInterval * _amountOfSwaps
        )} via ${txn.to}`
      ]
    },
    [iface.getSighash('terminate')]: (txn, network, { extended }) => {
      // used for the url, mean finance makes sense of the versions internaly
      const ORDER_VERSION = 4
      const { _positionId, _recipientUnswapped, _recipientSwapped } =
        iface.parseTransaction(txn).args
      if (extended)
        return [
          [
            `Terminate position ${_positionId}`,
            {
              type: 'link',
              link: `https://mean.finance/${network.chainId}/positions/${ORDER_VERSION}/${_positionId}`,
              text: 'more info here'
            }
          ],
          txn.from !== _recipientUnswapped
            ? ['Send', 'unswapped tokens to', getAddress(humanizerInfo, _recipientUnswapped)]
            : ['Withdraw', 'unswapped tokens'],
          txn.from !== _recipientSwapped
            ? ['Send', 'swapped tokens to', getAddress(humanizerInfo, _recipientSwapped)]
            : ['Withdraw', 'swapped tokens']
        ]
      return [
        `Terminate position ${_positionId}, send unswapped tokens to ${_recipientUnswapped} and send swapped tokens to ${_recipientSwapped}`
      ]
    },
    [iface.getSighash('withdrawSwapped')]: (txn, network, { extended }) => {
      const { _positionId, _recipient } = iface.parseTransaction(txn).args
      if (extended)
        return [
          _recipient === txn.from
            ? ['Withdraw', `swapped tokens from position ${_positionId}`]
            : [
                'Send',
                `swapped tokens from position ${_positionId} to`,
                getAddress(humanizerInfo, _recipient)
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
export default MeanFinance
