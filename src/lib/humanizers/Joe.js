import { Interface } from 'ethers/lib/utils'
import { token, getName } from 'lib/humanReadableTransactions'

const Joe = (humanizerInfo) => {
  const iface = new Interface(humanizerInfo.abis.JoeRouter)

  return {
    [iface.getSighash('swapExactTokensForAVAX')]: (txn, network, { extended }) => {
      const { amountIn, amountOutMin, path, to, deadline } = iface.parseTransaction(txn).args
      console.log({ amountIn, amountOutMin, path, to, deadline })
      if (extended)
        return [
          [
            'Swap',
            { type: 'token', ...token(humanizerInfo, path[0], amountIn, true) },
            'for at least',
            { type: 'token', ...token(humanizerInfo, path[path.length - 1], amountOutMin, true) },
            ...(txn.from !== to
              ? [
                  'and send swapped to',
                  { type: 'address', address: to, name: getName(humanizerInfo, to) }
                ]
              : [])
          ]
        ]
      return ['Joe']
    }
  }
}
export default Joe
