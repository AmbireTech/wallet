import { Interface } from 'ethers/lib/utils'
import { token, getName, nativeToken } from 'lib/humanReadableTransactions'

const Joe = (humanizerInfo) => {
  const iface = new Interface(humanizerInfo.abis.JoeRouter)

  return {
    [iface.getSighash('swapExactTokensForAVAX')]: (txn, network, { extended }) => {
      const { amountIn, amountOutMin, path, to, deadline } = iface.parseTransaction(txn).args
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
      return [
        `Swap ${token(humanizerInfo, path[0], amountIn)} for at least ${token(
          humanizerInfo,
          path[path.length - 1],
          amountOutMin
        )} ${txn.from !== to ? `and send swapped to ${getName(humanizerInfo, to)}` : ''}`
      ]
    },
    [iface.getSighash('swapExactAVAXForTokens(uint256,address[],address,uint256)')]: (
      txn,
      network,
      { extended }
    ) => {
      const { to, amountOutMin, path, deadline } = iface.parseTransaction(txn).args
      if (extended)
        return [
          [
            'Swap',
            { type: 'token', ...nativeToken(network, txn.value, true) },
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
      return [
        `Swap ${nativeToken(network, txn.value)} for at least ${token(
          humanizerInfo,
          path[path.length - 1],
          amountOutMin
        )} ${txn.from !== to ? ` and send swapped to ${getName(humanizerInfo, to)}` : ''}`
      ]
    },
    [iface.getSighash('swapAVAXForExactTokens(uint256,address[],address,uint256)')]: (
      txn,
      network,
      { extended }
    ) => {
      const [amountOutMin, path, to, deadline] = iface.parseTransaction(txn).args

      if (extended)
        return [
          [
            'Swap',
            { type: 'token', ...nativeToken(network, txn.value, true) },
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
      return [
        `Swap ${nativeToken(network, txn.value)} for at least ${token(
          humanizerInfo,
          path[path.length - 1],
          amountOutMin
        )} ${txn.from !== to ? ` and send swapped to ${getName(humanizerInfo, to)}` : ''}`
      ]
    }
  }
}
export default Joe
