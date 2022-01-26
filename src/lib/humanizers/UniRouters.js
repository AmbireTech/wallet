import { abis } from 'consts/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
import { nativeToken, token } from 'lib/humanReadableTransactions'

const iface = new Interface(abis.UniV2Router)
const recipientText = (recipient, txnFrom, extended = false) => recipient.toLowerCase() === txnFrom.toLowerCase()
  ? !extended ? ``: [] : !extended ? ` and send it to ${recipient}` : ['and send it to', { type: 'address', address: recipient }]

const deadlineText = (deadlineSecs, mined) => {
  if (mined) return ''
  const minute = 60000
  const deadline = deadlineSecs * 1000
  const diff = deadline - Date.now()
  if (diff < 0 && diff > -minute*2) return `, expired just now`
  // Disabled this: this is a bit of a hack cause we don't want it to show for mined txns
  // we don't really need it for pending ones, simply because we'll show the big error message instead
  //if (diff < 0) return `, expired ${Math.floor(-diff / minute)} minutes ago`
  if (diff < 0) return ''
  if (diff < minute) return `, expires in less than a minute`
  if (diff < 10*minute) return `, expires in ${Math.floor(diff / minute)} minutes`
  return ''
}

const toExtended = (fromToken, toToken, recipient, expires, atLeast = true) => {
  const upTo = !atLeast ? ['up to'] : []
  return [[
    'Swap',
    ...upTo,
    {
      type: 'token',
      ...fromToken
    },
    atLeast ? 'for at least' : 'for',
    {
      type: 'token',
      ...toToken
    },
    ...recipient,
    expires
  ]]
}

const uniV2Mapping = {
  // ordered in the same order as the router
  [iface.getSighash('swapExactTokensForTokens')]: (txn, network, opts = {}) => {
    const [ amountIn, amountOutMin, path, to, deadline ] = iface.parseTransaction(txn).args
    const outputAsset = path[path.length - 1]
    return !opts.extended ? 
      [`Swap ${token(path[0], amountIn)} for at least ${token(outputAsset, amountOutMin)}${recipientText(to, txn.from)}${deadlineText(deadline, opts.mined)}`]
      : toExtended(token(path[0], amountIn, true), token(outputAsset, amountOutMin, true), recipientText(to, txn.from, true), deadlineText(deadline, opts.mined))
  },
  [iface.getSighash('swapTokensForExactTokens')]: (txn, network, opts = {}) => {
    const [ amountOut, amountInMax, path, to, deadline ] = iface.parseTransaction(txn).args
    const outputAsset = path[path.length - 1]
    return [`Swap up to ${token(path[0], amountInMax)} for ${token(outputAsset, amountOut)}${recipientText(to, txn.from)}${deadlineText(deadline, opts.mined)}`]
  },
  [iface.getSighash('swapExactETHForTokens')]: (txn, network, opts = {}) => {
    const { args, value } = iface.parseTransaction(txn)
    const [ amountOutMin, path, to, deadline ] = args
    const outputAsset = path[path.length - 1]
    return !opts.extended ?
      [`Swap ${nativeToken(network, value)} for at least ${token(outputAsset, amountOutMin)}${recipientText(to, txn.from)}${deadlineText(deadline, opts.mined)}`]
      : toExtended(nativeToken(network, value, true), token(outputAsset, amountOutMin, true), recipientText(to, txn.from, true), deadlineText(deadline, opts.mined))
  },
  [iface.getSighash('swapTokensForExactETH')]: (txn, network, opts = {}) => {
    const [ amountOut, amountInMax, path, to, deadline ] = iface.parseTransaction(txn).args
    return [`Swap up to ${token(path[0], amountInMax)} for ${nativeToken(network, amountOut)}${recipientText(to, txn.from)}${deadlineText(deadline, opts.mined)}`]
  },
  [iface.getSighash('swapExactTokensForETH')]: (txn, network, opts = {}) => {
    const [ amountIn, amountOutMin, path, to, deadline ] = iface.parseTransaction(txn).args
    return [`Swap ${token(path[0], amountIn)} for at least ${nativeToken(network, amountOutMin)}${recipientText(to, txn.from)}${deadlineText(deadline, opts.mined)}`]
  },
  [iface.getSighash('swapETHForExactTokens')]: (txn, network, opts = {}) => {
    const { args, value } = iface.parseTransaction(txn)
    const [ amountOut, path, to, deadline ] = args
    const outputAsset = path[path.length - 1]
    return !opts.extended ? 
      [`Swap up to ${nativeToken(network, value)} for ${token(outputAsset, amountOut)}${recipientText(to, txn.from)}${deadlineText(deadline, opts.mined)}`]
      : toExtended(nativeToken(network, value, true), token(outputAsset, amountOut, true), recipientText(to, txn.from, true), deadlineText(deadline, opts.mined), false)
  },
  // Liquidity
  [iface.getSighash('addLiquidity')]: (txn, network, opts = {}) => {
    const [tokenA, tokenB, amountADesired, amountBDesired, /*amountAMin*/, /*amountBMin*/, to, deadline] =  iface.parseTransaction(txn).args
    return [`Add liquidity: ${token(tokenA, amountADesired)} and ${token(tokenB, amountBDesired)}${recipientText(to, txn.from)}${deadlineText(deadline, opts.mined)}`]
  },
  [iface.getSighash('addLiquidityETH')]: (txn, network, opts = {}) => {
    const { args, value } = iface.parseTransaction(txn)
    const [token, amountTokenDesired, /*amountTokenMin*/, /*amountETHMin*/, to, deadline] = args
    return [`Add liquidity: ${token(token, amountTokenDesired)} and ${nativeToken(network, value)}${recipientText(to, txn.from)}${deadlineText(deadline, opts.mined)}`]
  },
  [iface.getSighash('removeLiquidity')]: (txn, network, opts = {}) => {
    const [tokenA, tokenB, /*liquidity*/, amountAMin, amountBMin, to, deadline] =  iface.parseTransaction(txn).args
    return [`Remove liquidity: at least ${token(tokenA, amountAMin)} and ${token(tokenB, amountBMin)}${recipientText(to, txn.from)}${deadlineText(deadline, opts.mined)}`]
  },
  [iface.getSighash('removeLiquidityETH')]: (txn, network, opts = {}) => {
    const [token, /*liquidity*/, amountTokenMin, amountETHMin, to, deadline] =  iface.parseTransaction(txn).args
    return [`Remove liquidity: at least ${token(token, amountTokenMin)} and ${nativeToken(network, amountETHMin)}${recipientText(to, txn.from)}${deadlineText(deadline, opts.mined)}`]
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
    const args = ifaceV3.parseTransaction(txn).args
    const calls = args[args.length - 1]
    // @TODO: Multicall that outputs ETH should be detected as such and displayed as one action
    // the current verbosity of "Swap ..., unwrap WETH to ETH" will be a nice pedantic quirk
    const parsed = calls.map(data => {
      const sigHash = data.slice(0, 10)
      const humanizer = uniV3Mapping[sigHash]
      return humanizer ? humanizer({ ...txn, data }, network) : null
    }).flat().filter(x => x)
    return parsed.length ? parsed : [`Unknown Uni V3 interaction`]
  },
  // NOTE: selfPermit is not supported cause it requires an ecrecover signature
  [ifaceV3.getSighash('exactInputSingle')]: (txn, network, opts = {}) => {
    const [ params ] = ifaceV3.parseTransaction(txn).args
    // @TODO: consider fees
    return [`Swap ${token(params.tokenIn, params.amountIn)} for at least ${token(params.tokenOut, params.amountOutMinimum)}${recipientText(params.recipient, txn.from)}${deadlineText(params.deadline, opts.mined)}`]
  },
  [ifaceV3.getSighash('exactInput')]: (txn, network, opts = {}) => {
    const [ params ] = ifaceV3.parseTransaction(txn).args
    const path = parsePath(params.path)
    return [`Swap ${token(path[0], params.amountIn)} for at least ${token(path[path.length - 1], params.amountOutMinimum)}${recipientText(params.recipient, txn.from)}${deadlineText(params.deadline, opts.mined)}`]
  },
  [ifaceV3.getSighash('exactOutputSingle')]: (txn, network, opts = {}) => {
    const [ params ] = ifaceV3.parseTransaction(txn).args
    return [`Swap up to ${token(params.tokenIn, params.amountInMaximum)} for ${token(params.tokenOut, params.amountOut)}${recipientText(params.recipient, txn.from)}${deadlineText(params.deadline, opts.mined)}`]
  },
  [ifaceV3.getSighash('exactOutput')]: (txn, network, opts = {}) => {
    const [ params ] = ifaceV3.parseTransaction(txn).args
    const path = parsePath(params.path)
    return [`Swap up to ${token(path[0], params.amountInMaximum)} for ${token(path[path.length - 1], params.amountOut)}${recipientText(params.recipient, txn.from)}${deadlineText(params.deadline, opts.mined)}`]
  },
  [ifaceV3.getSighash('unwrapWETH9')]: (txn, network) => {
    const [ amountMin, recipient ] = ifaceV3.parseTransaction(txn).args
    return [`Unwrap at least ${nativeToken(network, amountMin)}${recipientText(recipient, txn.from)}`]
  },
}

const ifaceV32 = new Interface(abis.UniV3Router2)
const uniV32Mapping = {
  [ifaceV32.getSighash('multicall(uint256,bytes[])')]: (txn, network, opts = {}) => {
    const [deadline, calls] = ifaceV32.parseTransaction(txn).args
    // @TODO: Multicall that outputs ETH should be detected as such and displayed as one action
    // the current verbosity of "Swap ..., unwrap WETH to ETH" will be a nice pedantic quirk
    const parsed = calls.map(data => {
      const sigHash = data.slice(0, 10)
      const humanizer = uniV32Mapping[sigHash]
      return humanizer ? humanizer({ ...txn, data }, network) : null
    }).flat().filter(x => x)
    return (parsed.length ? parsed : [`Unknown Uni V3 interaction`])
      // the .slice(2) is needed cause usuall this returns something like ", expires"... and we concat all actions with ", " anyway
      .concat([deadlineText(deadline.toNumber(), opts.mined).slice(2)]).filter(x => x)
  },
  // NOTE: selfPermit is not supported cause it requires an ecrecover signature
  [ifaceV32.getSighash('exactInputSingle')]: (txn, network) => {
    const [ params ] = ifaceV32.parseTransaction(txn).args
    // @TODO: consider fees
    return [`Swap ${token(params.tokenIn, params.amountIn)} for at least ${token(params.tokenOut, params.amountOutMinimum)}${recipientText(params.recipient, txn.from)}`]
  },
  [ifaceV32.getSighash('exactInput')]: (txn, network) => {
    const [ params ] = ifaceV32.parseTransaction(txn).args
    const path = parsePath(params.path)
    return [`Swap ${token(path[0], params.amountIn)} for at least ${token(path[path.length - 1], params.amountOutMinimum)}${recipientText(params.recipient, txn.from)}`]
  },
  [ifaceV32.getSighash('exactOutputSingle')]: (txn, network) => {
    const [ params ] = ifaceV32.parseTransaction(txn).args
    return [`Swap up to ${token(params.tokenIn, params.amountInMaximum)} for ${token(params.tokenOut, params.amountOut)}${recipientText(params.recipient, txn.from)}`]
  },
  [ifaceV32.getSighash('exactOutput')]: (txn, network) => {
    const [ params ] = ifaceV32.parseTransaction(txn).args
    const path = parsePath(params.path)
    return [`Swap up to ${token(path[0], params.amountInMaximum)} for ${token(path[path.length - 1], params.amountOut)}${recipientText(params.recipient, txn.from)}}`]
  },
  [ifaceV32.getSighash('swapTokensForExactTokens')]: (txn, network) => {
    // NOTE: is amountInMax set when dealing with ETH? it should be... cause value and max are not the same thing
    const { amountOut, amountInMax, path, to } = ifaceV32.parseTransaction(txn).args
    return [`Swap up to ${token(path[0], amountInMax)} for ${token(path[path.length - 1], amountOut)}${recipientText(to, txn.from)}}`]
  },
  [ifaceV32.getSighash('swapExactTokensForTokens')]: (txn, network) => {
    // NOTE: is amountIn set when dealing with ETH?
    const { amountIn, amountOutMin, path, to } = ifaceV32.parseTransaction(txn).args
    return [`Swap ${token(path[0], amountIn)} for at least ${token(path[path.length - 1], amountOutMin)}${recipientText(to, txn.from)}`]
  },
  [ifaceV32.getSighash('unwrapWETH9(uint256)')]: (txn, network) => {
    const [ amountMin ] = ifaceV32.parseTransaction(txn).args
    return [`Unwrap at least ${nativeToken(network, amountMin)}`]
  },
  [ifaceV32.getSighash('unwrapWETH9(uint256,address)')]: (txn, network) => {
    const [ amountMin, recipient ] = ifaceV32.parseTransaction(txn).args
    return [`Unwrap at least ${nativeToken(network, amountMin)}${recipientText(recipient, txn.from)}`]
  },
}


const mapping = { ...uniV2Mapping, ...uniV3Mapping, ...uniV32Mapping }
export default mapping