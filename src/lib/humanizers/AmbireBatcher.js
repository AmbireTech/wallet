import { Interface } from 'ethers/lib/utils'
import humanizers from './'

const AmbireBatcher = (humanizerInfo, tokenList) => {
  const { abis } = humanizerInfo
  const iface = new Interface(abis.Batcher)

  return {
    [iface.getSighash('batchCall')]: (txn, network, opts) => {
      const { txns } = iface.parseTransaction(txn).args
      const { to, value, data, from } = txns[txns.length - 1]
      const sigHash = data.slice(0, 10)
      const humanizer = humanizers({humanizerInfo, tokenList})[sigHash]
      return humanizer({ to, value, data, from }, network, opts)
    },
  }
}
export default AmbireBatcher