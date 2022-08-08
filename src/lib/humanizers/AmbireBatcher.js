import { abis } from 'ambire-common/src/constants/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
import humanizers from './'

const iface = new Interface(abis.Batcher)

const AmbireBatcher = {
  [iface.getSighash('batchCall')]: (txn, network, opts) => {
    const { txns } = iface.parseTransaction(txn).args
    const { to, value, data, from } = txns[txns.length - 1]
    const sigHash = data.slice(0, 10)
    const humanizer = humanizers[sigHash]
    return humanizer({ to, value, data, from }, network, opts)
  },
}
export default AmbireBatcher