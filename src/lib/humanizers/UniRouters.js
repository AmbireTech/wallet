import { abis } from '../../consts/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
import { nativeToken, token } from '../humanReadableTransactions'

const iface = new Interface(abis.UniV2Router)
const recipientText = (recipient, txnFrom) => recipient.toLowerCase() === txnFrom.toLowerCase()
  ? `` : ` and send it to ${recipient}`
const deadlineText = deadlineSecs => {
  const minute = 60000
  const deadline = deadlineSecs * 1000
  const diff = deadline - Date.now()
  if (diff < 0 && diff > -minute*2) return `, expired just now`
  if (diff < 0) return `, expired ${Math.floor(-diff / minute)} minutes ago`
  if (diff < minute) return `, expires in less than a minute`
  if (diff < 10*minute) return `, expires in ${Math.floor(diff / minute)} minutes`
  return ''
}

const uniV2Mapping = {
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
  [iface.getSighash('swapExactETHForTokens')]: (txn, network) => {
    const { args, value } = iface.parseTransaction(txn)
    const [ amountOutMin, path, to, deadline ] = args
    const outputAsset = path[path.length - 1]
    return [`Swap ${nativeToken(network, value)} for at least ${token(outputAsset, amountOutMin)}${recipientText(to, txn.from)}${deadlineText(deadline)}`]
  },
  [iface.getSighash('swapTokensForExactETH')]: (txn, network) => {
    const [ amountOut, amountInMax, path, to, deadline ] = iface.parseTransaction(txn).args
    return [`Swap up to ${token(path[0], amountInMax)} for ${nativeToken(network, amountOut)}${recipientText(to, txn.from)}${deadlineText(deadline)}`]
  },
  [iface.getSighash('swapExactTokensForETH')]: (txn, network) => {
    const [ amountIn, amountOutMin, path, to, deadline ] = iface.parseTransaction(txn).args
    return [`Swap ${token(path[0], amountIn)} for at least ${nativeToken(network, amountOutMin)}${recipientText(to, txn.from)}${deadlineText(deadline)}`]
  },
  [iface.getSighash('swapETHForExactTokens')]: (txn, network) => {
    const { args, value } = iface.parseTransaction(txn)
    const [ amountOut, path, to, deadline ] = args
    const outputAsset = path[path.length - 1]
    return [`Swap up to ${nativeToken(network, value)} for ${token(outputAsset, amountOut)}${recipientText(to, txn.from)}${deadlineText(deadline)}`]
  },
  // Liquidity
  [iface.getSighash('addLiquidity')]: (txn, network) => {
    const [tokenA, tokenB, amountADesired, amountBDesired, /*amountAMin*/, /*amountBMin*/, to, deadline] =  iface.parseTransaction(txn).args
    return [`Add liquidity: ${token(tokenA, amountADesired)} and ${token(tokenB, amountBDesired)}${recipientText(to, txn.from)}${deadlineText(deadline)}`]
  },
  [iface.getSighash('addLiquidityETH')]: (txn, network) => {
    const { args, value } = iface.parseTransaction(txn)
    const [token, amountTokenDesired, /*amountTokenMin*/, /*amountETHMin*/, to, deadline] = args
    return [`Add liquidity: ${token(token, amountTokenDesired)} and ${nativeToken(network, value)}${recipientText(to, txn.from)}${deadlineText(deadline)}`]
  },
  [iface.getSighash('removeLiquidity')]: (txn, network) => {
    const [tokenA, tokenB, /*liquidity*/, amountAMin, amountBMin, to, deadline] =  iface.parseTransaction(txn).args
    return [`Remove liquidity: at least ${token(tokenA, amountAMin)} and ${token(tokenB, amountBMin)}${recipientText(to, txn.from)}${deadlineText(deadline)}`]
  },
  [iface.getSighash('removeLiquidityETH')]: (txn, network) => {
    const [token, /*liquidity*/, amountTokenMin, amountETHMin, to, deadline] =  iface.parseTransaction(txn).args
    return [`Remove liquidity: at least ${token(token, amountTokenMin)} and ${nativeToken(network, amountETHMin)}${recipientText(to, txn.from)}${deadlineText(deadline)}`]
  },
  // NOTE: We currently do not support *WithPermit functions cause they require an ecrecover signature
  // Uniswap will detect we don't support it cause it will fail on requesting eth_signTypedData_v4
}

const ifaceV3 = new Interface(abis.UniV3Router)
const parsePath = pathBytes => {
    // some decodePacked fun
    // can we do this with Ethers AbiCoder? probably not
    let path = []
    // address, uint24
    for (let i = 2; i < pathBytes.length; i += 46) {
      path.push('0x' + pathBytes.substr(i, 40))
    }
    return path
}
const uniV3Mapping = {
  [ifaceV3.getSighash('multicall')]: (txn, network) => {
    const [ calls ] = ifaceV3.parseTransaction(txn).args
    // @TODO: Multicall that outputs ETH should be detected as such and displayed as one action
    // the current verbosity of "Swap ..., unwrap WETH to ETH" will be a nice pedantic quirk
    return calls.map(data => {
      const humanizer = uniV3Mapping[data.slice(0, 10)]
      return humanizer ? humanizer({ ...txn, data }) : null
    }).flat().filter(x => x)
  },
  // NOTE: selfPermit is not supported cause it requires an ecrecover signature
  [ifaceV3.getSighash('exactInputSingle')]: (txn, network) => {
    const [ params ] = ifaceV3.parseTransaction(txn).args
    // @TODO: consider fees
    return [`Swap ${token(params.tokenIn, params.amountIn)} for at least ${token(params.tokenOut, params.amountOutMinimum)}${recipientText(params.recipient, txn.from)}${deadlineText(params.deadline)}`]
  },
  [ifaceV3.getSighash('exactInput')]: (txn, network) => {
    const [ params ] = ifaceV3.parseTransaction(txn).args
    const path = parsePath(params.path)
    return [`Swap ${token(path[0], params.amountIn)} for at least ${token(path[path.length - 1], params.amountOutMinimum)}${recipientText(params.recipient, txn.from)}${deadlineText(params.deadline)}`]
  },
  [ifaceV3.getSighash('exactOutputSingle')]: (txn, network) => {
    const [ params ] = ifaceV3.parseTransaction(txn).args
    return [`Swap up to ${token(params.tokenIn, params.amountInMaximum)} for ${token(params.tokenOut, params.amountOut)}${recipientText(params.recipient, txn.from)}${deadlineText(params.deadline)}`]
  },
  [ifaceV3.getSighash('exactOutput')]: (txn, network) => {
    const [ params ] = ifaceV3.parseTransaction(txn).args
    const path = parsePath(params.path)
    return [`Swap up to ${token(path[0], params.amountInMaximum)} for ${token(path[path.length - 1], params.amountOut)}${recipientText(params.recipient, txn.from)}${deadlineText(params.deadline)}`]
  },
}

const mapping = { ...uniV2Mapping, ...uniV3Mapping }
export default mapping