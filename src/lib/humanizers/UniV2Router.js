import { abis } from '../../consts/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
import { nativeToken, token, getContractName } from '../humanReadableTransactions'

const iface = new Interface(abis.UniV2Router)
const recipientText = (recipient, txnFrom) => recipient.toLowerCase() === txnFrom.toLowerCase()
  ? `` : ` and send it to ${recipient}`
const deadlineText = deadlineSecs => {
  const minute = 60000
  const deadline = deadlineSecs * 1000
  if (deadline-Date.now() < 10*minute) return `, expires in ${Math.floor((deadline-Date.now()) / minute)} minutes`
  return ''
}

export default {
  // @TODO add liquidity
  // ordered in the same order as the router
  [iface.getSighash('swapExactTokensForTokens')]: (txn, network) => {
    const [ amountIn, amountOutMin, path, to, deadline ] = iface.parseTransaction(txn).args
    const outputAsset = path[path.length - 1]
    return [`Swap ${token(path[0], amountIn)} for at least ${token(outputAsset, amountOutMin)}${recipientText(to, txn.from)}${deadlineText(deadline)}`]
  },
  [iface.getSighash('swapTokensForExactTokens')]: (txn, network) => {
    const [ amountOut, amountInMax, path, to, deadline ] = iface.parseTransaction(txn).args
    const outputAsset = path[path.length - 1]
    return [`Swap up to ${token(path[0], amountInMax)} for ${token(outputAsset, amountOut)}${recipientText(to, txn.from)}${deadlineText(deadline)}`]
  },
  [iface.getSighash('swapTokensForExactETH')]: (txn, network) => {
    const [ amountOut, amountInMax, path, to, deadline ] = iface.parseTransaction(txn).args
    return [`Swap up to ${token(path[0], amountInMax)} for ${nativeToken(network, amountOut)}${recipientText(to, txn.from)}${deadlineText(deadline)}`]
  },
  [iface.getSighash('swapExactTokensForETH')]: (txn, network) => {
    const [ amountIn, amountOutMin, path, to, deadline ] = iface.parseTransaction(txn).args
    return [`Swap ${token(path[0], amountIn)} for at least ${nativeToken(network, amountOutMin)}${recipientText(to, txn.from)}${deadlineText(deadline)}`]
  },
  [iface.getSighash('swapExactETHForTokens')]: (txn, network) => {
    const { args, value } = iface.parseTransaction(txn)
    const [ amountOutMin, path, to, deadline ] = args
    const outputAsset = path[path.length - 1]
    return [`Swap ${nativeToken(network, value)} for at least ${token(outputAsset, amountOutMin)}${recipientText(to, txn.from)}${deadlineText(deadline)}`]
  },
}
