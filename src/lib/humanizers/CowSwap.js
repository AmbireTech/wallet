import { Interface } from 'ethers/lib/utils'
import { token } from 'lib/humanReadableTransactions'

const onBehalfText = (onBehalf, txnFrom) =>
  onBehalf.toLowerCase() !== txnFrom.toLowerCase() ? ` on behalf of ${onBehalf}` : ''

const CowSwap = (humanizerInfo) => {
  const iface = new Interface(humanizerInfo.abis.CowSwapSettlement)

  return {
    [iface.getSighash('setPreSignature')]: (txn, network, { extended }) => {
      const [orderUid, _signed] = iface.parseTransaction(txn).args
      if (extended)
        return [
          [
            'Execute CowSwap order',
            {
              type: 'link',
              link: `https://explorer.cow.fi/orders/${orderUid}?tab=overview`,
              text: 'more info here'
            }
          ]
        ]
      return [`Order ${orderUid}`]
    }
  }
}
export default CowSwap
