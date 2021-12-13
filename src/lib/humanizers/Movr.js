import { abis } from '../../consts/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
import { token } from '../humanReadableTransactions'
import networks from '../../consts/networks'

const iface = new Interface(abis.MovrAnyswap)
const getNetwork = chainId => networks.find(n => n.chainId === Number(chainId)).name

const MovrMapping = {
  [iface.getSighash('outboundTransferTo')]: (txn, network) => {
    const { middlewareInputToken, amount, tokenToBridge, toChainId } = iface.parseTransaction(txn).args[0]
    return [`Transfer ${token(middlewareInputToken, amount)} to ${getNetwork(toChainId)} for ${token(tokenToBridge)}`]
  },
}
export default MovrMapping