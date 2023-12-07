import { Interface } from 'ethers/lib/utils'
import { token, getName } from 'lib/humanReadableTransactions'

function getInterval(seconds) {
  if (seconds <= 60) return `${seconds} seconds`
  if (seconds <= 60 * 60) return `${seconds / 60} minutes`
  if (seconds <= 60 * 60 * 24) return `${seconds / 60 / 60} hours`
  if (seconds <= 60 * 60 * 24 * 7) return `${seconds / 60 / 60 / 24} days`
  if (seconds <= 60 * 60 * 24 * 30) return `${seconds / 60 / 60 / 24 / 7} weeks`
}
const MeanFinance = (humanizerInfo) => {
  const iface = new Interface(humanizerInfo.abis.DCAHub)

  return {
    [iface.getSighash(
      'deposit(address,address,uint256,uint32,uint32,address,(address,uint8[])[])'
    )]: (txn, network, { extended }) => {
      // @TODO add address check
      const { _from, _to, _amountOfSwaps, _swapInterval, _owner, _permissions, _amount } =
        iface.parseTransaction(txn).args
      console.log('watafak')
      console.log({
        type: 'token',
        ...token(humanizerInfo, _to, -1, true)
      })
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
              ...token(humanizerInfo, _to, -1, true)
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
      return ['wawtafak']
    }
  }
}
export default MeanFinance
