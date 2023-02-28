import { Interface, AbiCoder, arrayify, hexlify } from 'ethers/lib/utils'
import { nativeToken, token, getName } from 'lib/humanReadableTransactions'
import { COMMANDS, COMMANDS_DESCRIPTIONS } from './Commands'

const recipientText = (humanizerInfo, recipient, txnFrom, extended = false) => recipient.toLowerCase() === txnFrom.toLowerCase()
  ? extended ? ``: [] : extended ? ` and send it to ${recipient}` : ['and send it to', { type: 'address', address: recipient, name: getName(humanizerInfo, recipient) }]

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

const toExtendedUnwrap = (action, network, amount, recipient = []) => {
  return [[
      action,
      {
        type: 'token',
        ...nativeToken(network, amount, true)
      },
      ...recipient
    ]]
}

const toExtended = (action, word, fromToken, toToken, recipient, expires = []) => {
  return [[
    action,
    {
      type: 'token',
      ...fromToken
    },
    word,
    {
      type: 'token',
      ...toToken
    },
    ...recipient,
    expires
  ]]
}

const coder = new AbiCoder()
const extractParams = (inputsDetails, input) => {
  const types = inputsDetails.map(i => i.type)
  const decodedInput = coder.decode(types, input)
  
  let params = {}
  inputsDetails.forEach((item, index) => {
    params[item.name] = decodedInput[index]
  })

  return params
}

const uniV2Mapping = (humanizerInfo) =>  {
  const iface = new Interface(humanizerInfo.abis.UniV2Router)

  return {
    // ordered in the same order as the router
    [iface.getSighash('swapExactTokensForTokens')]: (txn, network, opts = {}) => {
      const [ amountIn, amountOutMin, path, to, deadline ] = iface.parseTransaction(txn).args
      const outputAsset = path[path.length - 1]
      return !opts.extended
        ? [`Swap ${token(humanizerInfo, path[0], amountIn)} for at least ${token(humanizerInfo, outputAsset, amountOutMin)}${recipientText(humanizerInfo, to, txn.from)}${deadlineText(deadline, opts.mined)}`]
        : toExtended('Swap', 'for at least', token(humanizerInfo, path[0], amountIn, true), token(humanizerInfo, outputAsset, amountOutMin, true), recipientText(humanizerInfo, to, txn.from, true), deadlineText(deadline, opts.mined))
    },
    [iface.getSighash('swapTokensForExactTokens')]: (txn, network, opts = {}) => {
      const [ amountOut, amountInMax, path, to, deadline ] = iface.parseTransaction(txn).args
      const outputAsset = path[path.length - 1]
      return !opts.extended
        ? [`Swap up to ${token(humanizerInfo, path[0], amountInMax)} for ${token(humanizerInfo, outputAsset, amountOut)}${recipientText(humanizerInfo, to, txn.from)}${deadlineText(deadline, opts.mined)}`]
        : toExtended('Swap up to', 'for', token(humanizerInfo, path[0], amountInMax, true), token(humanizerInfo, outputAsset, amountOut, true), recipientText(humanizerInfo, to, txn.from, true), deadlineText(deadline, opts.mined))
    },
    [iface.getSighash('swapExactETHForTokens')]: (txn, network, opts = {}) => {
      const { args, value } = iface.parseTransaction(txn)
      const [ amountOutMin, path, to, deadline ] = args
      const outputAsset = path[path.length - 1]
      return !opts.extended
        ? [`Swap ${nativeToken(network, value)} for at least ${token(humanizerInfo, outputAsset, amountOutMin)}${recipientText(humanizerInfo, to, txn.from)}${deadlineText(deadline, opts.mined)}`]
        : toExtended('Swap', 'for at least', nativeToken(network, value, true), token(humanizerInfo, outputAsset, amountOutMin, true), recipientText(humanizerInfo, to, txn.from, true), deadlineText(deadline, opts.mined))
    },
    [iface.getSighash('swapTokensForExactETH')]: (txn, network, opts = {}) => {
      const [ amountOut, amountInMax, path, to, deadline ] = iface.parseTransaction(txn).args
      return !opts.extended
        ? [`Swap up to ${token(humanizerInfo, path[0], amountInMax)} for ${nativeToken(network, amountOut)}${recipientText(humanizerInfo, to, txn.from)}${deadlineText(deadline, opts.mined)}`]
        : toExtended('Swap up to', 'for', token(humanizerInfo, path[0], amountInMax, true), nativeToken(network, amountOut, true), recipientText(humanizerInfo, to, txn.from, true), deadlineText(deadline, opts.mined))
    },
    [iface.getSighash('swapExactTokensForETH')]: (txn, network, opts = {}) => {
      const [ amountIn, amountOutMin, path, to, deadline ] = iface.parseTransaction(txn).args
      return !opts.extended
        ? [`Swap ${token(humanizerInfo, path[0], amountIn)} for at least ${nativeToken(network, amountOutMin)}${recipientText(humanizerInfo, to, txn.from)}${deadlineText(deadline, opts.mined)}`]
        : toExtended('Swap', 'for at least', token(humanizerInfo, path[0], amountIn, true), nativeToken(network, amountOutMin, true), recipientText(humanizerInfo, to, txn.from, true), deadlineText(deadline, opts.mined))
    },
    [iface.getSighash('swapETHForExactTokens')]: (txn, network, opts = {}) => {
      const { args, value } = iface.parseTransaction(txn)
      const [ amountOut, path, to, deadline ] = args
      const outputAsset = path[path.length - 1]
      return !opts.extended
        ? [`Swap up to ${nativeToken(network, value)} for ${token(humanizerInfo, outputAsset, amountOut)}${recipientText(humanizerInfo, to, txn.from)}${deadlineText(deadline, opts.mined)}`]
        : toExtended('Swap up to', 'for', nativeToken(network, value, true), token(humanizerInfo, outputAsset, amountOut, true), recipientText(humanizerInfo, to, txn.from, true), deadlineText(deadline, opts.mined))
    },
    // Liquidity
    [iface.getSighash('addLiquidity')]: (txn, network, opts = {}) => {
      const [tokenA, tokenB, amountADesired, amountBDesired, /*amountAMin*/, /*amountBMin*/, to, deadline] =  iface.parseTransaction(txn).args
      return !opts.extended
        ? [`Add liquidity: ${token(humanizerInfo, tokenA, amountADesired)} and ${token(humanizerInfo, tokenB, amountBDesired)}${recipientText(humanizerInfo, to, txn.from)}${deadlineText(deadline, opts.mined)}`]
        : toExtended('Add liquidity:', 'and', token(humanizerInfo, tokenA, amountADesired, true), token(humanizerInfo, tokenB, amountBDesired, true), recipientText(humanizerInfo, to, txn.from, true), deadlineText(deadline, opts.mined))
    },
    [iface.getSighash('addLiquidityETH')]: (txn, network, opts = {}) => {
      const { args, value } = iface.parseTransaction(txn)
      const [token, amountTokenDesired, /*amountTokenMin*/, /*amountETHMin*/, to, deadline] = args
      return !opts.extended
        ? [`Add liquidity: ${token(humanizerInfo, token, amountTokenDesired)} and ${nativeToken(network, value)}${recipientText(humanizerInfo, to, txn.from)}${deadlineText(deadline, opts.mined)}`]
        : toExtended('Add liquidity:', 'and', token(humanizerInfo, token, amountTokenDesired, true), nativeToken(network, value), recipientText(humanizerInfo, to, txn.from, true), deadlineText(deadline, opts.mined))
    },
    [iface.getSighash('removeLiquidity')]: (txn, network, opts = {}) => {
      const [tokenA, tokenB, /*liquidity*/, amountAMin, amountBMin, to, deadline] =  iface.parseTransaction(txn).args
      return !opts.extended
        ? [`Remove liquidity: at least ${token(humanizerInfo, tokenA, amountAMin)} and ${token(humanizerInfo, tokenB, amountBMin)}${recipientText(humanizerInfo, to, txn.from)}${deadlineText(deadline, opts.mined)}`]
        : toExtended('Remove liquidity: at least', 'and', token(humanizerInfo, tokenA, amountAMin, true), token(humanizerInfo, tokenB, amountBMin, true), recipientText(humanizerInfo, to, txn.from, true), deadlineText(deadline, opts.mined))
    },
    [iface.getSighash('removeLiquidityETH')]: (txn, network, opts = {}) => {
      const [token, /*liquidity*/, amountTokenMin, amountETHMin, to, deadline] =  iface.parseTransaction(txn).args
      return !opts.extended
        ? [`Remove liquidity: at least ${token(humanizerInfo, token, amountTokenMin)} and ${nativeToken(network, amountETHMin)}${recipientText(humanizerInfo, to, txn.from)}${deadlineText(deadline, opts.mined)}`]
        : toExtended('Remove liquidity: at least', 'and', token(humanizerInfo, token, amountTokenMin, true), nativeToken(network, amountETHMin), recipientText(humanizerInfo, to, txn.from, true), deadlineText(deadline, opts.mined))
    },
    // NOTE: We currently do not support *WithPermit functions cause they require an ecrecover signature
    // Uniswap will detect we don't support it cause it will fail on requesting eth_signTypedData_v4
  }
}

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

const uniV3Mapping = (humanizerInfo) => {
  const ifaceV3 = new Interface(humanizerInfo.abis.UniV3Router)

  return {
    [ifaceV3.getSighash('multicall')]: (txn, network) => {
      const args = ifaceV3.parseTransaction(txn).args
      const calls = args[args.length - 1]
      const mappingResult = uniV32Mapping(humanizerInfo)
      // @TODO: Multicall that outputs ETH should be detected as such and displayed as one action
      // the current verbosity of "Swap ..., unwrap WETH to ETH" will be a nice pedantic quirk
      const parsed = calls.map(data => {
        const sigHash = data.slice(0, 10)
        const humanizer = mappingResult[sigHash]
        return humanizer ? humanizer({ ...txn, data }, network) : null
      }).flat().filter(x => x)
      return parsed.length ? parsed : [`Unknown Uni V3 interaction`]
    },
    // NOTE: selfPermit is not supported cause it requires an ecrecover signature
    [ifaceV3.getSighash('exactInputSingle')]: (txn, network, opts = {}) => {
      const [ params ] = ifaceV3.parseTransaction(txn).args
      // @TODO: consider fees
      return !opts.extended 
        ? [`Swap ${token(humanizerInfo, params.tokenIn, params.amountIn)} for at least ${token(humanizerInfo, params.tokenOut, params.amountOutMinimum)}${recipientText(humanizerInfo, params.recipient, txn.from)}${deadlineText(params.deadline, opts.mined)}`]
        : toExtended('Swap', 'for at least', token(humanizerInfo, params.tokenIn, params.amountIn, true), token(humanizerInfo, params.tokenOut, params.amountOutMinimum, true), recipientText(humanizerInfo, params.recipient, txn.from), deadlineText(params.deadline, opts.mined))
    },
    [ifaceV3.getSighash('exactInput')]: (txn, network, opts = {}) => {
      const [ params ] = ifaceV3.parseTransaction(txn).args
      const path = parsePath(params.path)
      return !opts.extended 
        ? [`Swap ${token(humanizerInfo, path[0], params.amountIn)} for at least ${token(humanizerInfo, path[path.length - 1], params.amountOutMinimum)}${recipientText(humanizerInfo, params.recipient, txn.from)}${deadlineText(params.deadline, opts.mined)}`]
        : toExtended('Swap', 'for at least', token(humanizerInfo, path[0], params.amountIn, true), token(humanizerInfo, path[path.length - 1], params.amountOutMinimum, true), recipientText(humanizerInfo, params.recipient, txn.from), deadlineText(params.deadline, opts.mined))
    },
    [ifaceV3.getSighash('exactOutputSingle')]: (txn, network, opts = {}) => {
      const [ params ] = ifaceV3.parseTransaction(txn).args
      return !opts.extended 
        ? [`Swap up to ${token(humanizerInfo, params.tokenIn, params.amountInMaximum)} for ${token(humanizerInfo, params.tokenOut, params.amountOut)}${recipientText(humanizerInfo, params.recipient, txn.from)}${deadlineText(params.deadline, opts.mined)}`]
        : toExtended('Swap up to', 'for', token(humanizerInfo, params.tokenIn, params.amountInMaximum, true), token(humanizerInfo, params.tokenOut, params.amountOut, true), recipientText(humanizerInfo, params.recipient, txn.from), deadlineText(params.deadline, opts.mined))
    },
    [ifaceV3.getSighash('exactOutput')]: (txn, network, opts = {}) => {
      const [ params ] = ifaceV3.parseTransaction(txn).args
      const path = parsePath(params.path)
      return !opts.extended 
        ? [`Swap up to ${token(humanizerInfo, path[path.length - 1], params.amountInMaximum)} for ${token(humanizerInfo, path[0], params.amountOut)}${recipientText(humanizerInfo, params.recipient, txn.from)}${deadlineText(params.deadline, opts.mined)}`]
        : toExtended('Swap up to', 'for', token(humanizerInfo, path[path.length - 1], params.amountInMaximum, true), token(humanizerInfo, path[0], params.amountOut, true), recipientText(humanizerInfo, params.recipient, txn.from), deadlineText(params.deadline, opts.mined))
    },
    [ifaceV3.getSighash('unwrapWETH9')]: (txn, network, opts = {}) => {
      const [ amountMin, recipient ] = ifaceV3.parseTransaction(txn).args
      return !opts.extended
        ? [`Unwrap at least ${nativeToken(network, amountMin)}${recipientText(humanizerInfo,recipient, txn.from)}`]
        : toExtendedUnwrap('Unwrap at least', network, amountMin, recipientText(humanizerInfo,recipient, txn.from, true))
    },
  }
}

const uniV32Mapping = (humanizerInfo) => {
  const ifaceV32 = new Interface(humanizerInfo.abis.UniV3Router2)

  return {
    [ifaceV32.getSighash('multicall(uint256,bytes[])')]: (txn, network, opts = {}) => {
      opts.mined = opts.mined || false
      const [deadline, calls] = ifaceV32.parseTransaction(txn).args
      const mappingResult = uniV32Mapping(humanizerInfo)
      // @TODO: Multicall that outputs ETH should be detected as such and displayed as one action
      // the current verbosity of "Swap ..., unwrap WETH to ETH" will be a nice pedantic quirk
      const parsed = calls.map(data => {
        const sigHash = data.slice(0, 10)
        const humanizer = mappingResult[sigHash]
        return humanizer ? humanizer({ ...txn, data }, network, opts) : null
      }).flat().filter(x => x)
      return (parsed.length ? parsed : [`Unknown Uni V3 interaction`])
        // the .slice(2) is needed cause usuall this returns something like ", expires"... and we concat all actions with ", " anyway
        .concat([deadlineText(deadline.toNumber(), opts.mined).slice(2)]).filter(x => x)
    },
    // NOTE: selfPermit is not supported cause it requires an ecrecover signature
    [ifaceV32.getSighash('exactInputSingle')]: (txn, network, opts = {}) => {
      const [ params ] = ifaceV32.parseTransaction(txn).args
      // @TODO: consider fees
      return !opts.extended 
        ? [`Swap ${token(humanizerInfo, params.tokenIn, params.amountIn)} for at least ${token(humanizerInfo, params.tokenOut, params.amountOutMinimum)}${recipientText(humanizerInfo, params.recipient, txn.from)}`]
        : toExtended('Swap', 'for at least', token(humanizerInfo, params.tokenIn, params.amountIn, true), token(humanizerInfo, params.tokenOut, params.amountOutMinimum, true), recipientText(humanizerInfo, params.recipient, txn.from))
    },
    [ifaceV32.getSighash('exactInput')]: (txn, network, opts = {}) => {
      const [ params ] = ifaceV32.parseTransaction(txn).args
      const path = parsePath(params.path)
      return !opts.extended
        ? [`Swap ${token(humanizerInfo, path[0], params.amountIn)} for at least ${token(humanizerInfo, path[path.length - 1], params.amountOutMinimum)}${recipientText(humanizerInfo, params.recipient, txn.from)}`]
        : toExtended('Swap', 'for at least', token(humanizerInfo, path[0], params.amountIn, true), token(humanizerInfo, path[path.length - 1], params.amountOutMinimum, true), recipientText(humanizerInfo, params.recipient, txn.from))
    },
    [ifaceV32.getSighash('exactOutputSingle')]: (txn, network, opts = {}) => {
      const [ params ] = ifaceV32.parseTransaction(txn).args
      return !opts.extended
        ? [`Swap up to ${token(humanizerInfo, params.tokenIn, params.amountInMaximum)} for ${token(humanizerInfo, params.tokenOut, params.amountOut)}${recipientText(humanizerInfo, params.recipient, txn.from)}`]
        : toExtended('Swap up to', 'for', token(humanizerInfo, params.tokenIn, params.amountInMaximum, true), token(humanizerInfo, params.tokenOut, params.amountOut, true), recipientText(humanizerInfo, params.recipient, txn.from))
    },
    [ifaceV32.getSighash('exactOutput')]: (txn, network, opts = {}) => {
      const [ params ] = ifaceV32.parseTransaction(txn).args
      const path = parsePath(params.path)
      return !opts.extended
        ? [`Swap up to ${token(humanizerInfo, path[path.length - 1], params.amountInMaximum)} for ${token(humanizerInfo, path[0], params.amountOut)}${recipientText(humanizerInfo, params.recipient, txn.from)}`]
        : toExtended('Swap up to', 'for', token(humanizerInfo, path[path.length - 1], params.amountInMaximum, true), token(humanizerInfo, path[0], params.amountOut, true), recipientText(humanizerInfo, params.recipient, txn.from))
    },
    [ifaceV32.getSighash('swapTokensForExactTokens')]: (txn, network, opts = {}) => {
      // NOTE: is amountInMax set when dealing with ETH? it should be... cause value and max are not the same thing
      const { amountOut, amountInMax, path, to } = ifaceV32.parseTransaction(txn).args
      return !opts.extended 
        ? [`Swap up to ${token(humanizerInfo, path[0], amountInMax)} for ${token(humanizerInfo, path[path.length - 1], amountOut)}${recipientText(humanizerInfo, to, txn.from)}`]
        : toExtended('Swap up to', 'for', token(humanizerInfo, path[0], amountInMax, true), token(humanizerInfo, path[path.length - 1], amountOut, true), recipientText(humanizerInfo, to, txn.from))
    },
    [ifaceV32.getSighash('swapExactTokensForTokens')]: (txn, network, opts = {}) => {
      // NOTE: is amountIn set when dealing with ETH?
      const { amountIn, amountOutMin, path, to } = ifaceV32.parseTransaction(txn).args
      return !opts.extended
        ? [`Swap ${token(humanizerInfo, path[0], amountIn)} for at least ${token(humanizerInfo, path[path.length - 1], amountOutMin)}${recipientText(humanizerInfo, to, txn.from)}`]
        : toExtended('Swap', 'for at least', token(humanizerInfo, path[0], amountIn, true), token(humanizerInfo, path[path.length - 1], amountOutMin, true), recipientText(humanizerInfo, to, txn.from))
    },
    [ifaceV32.getSighash('unwrapWETH9(uint256)')]: (txn, network, opts = {}) => {
      const [ amountMin ] = ifaceV32.parseTransaction(txn).args
      return !opts.extended
        ? [`Unwrap at least ${nativeToken(network, amountMin)}`]
        : toExtendedUnwrap('Unwrap at least', network, amountMin)
    },
    [ifaceV32.getSighash('unwrapWETH9(uint256,address)')]: (txn, network, opts = {}) => {
      const [ amountMin, recipient ] = ifaceV32.parseTransaction(txn).args
      return !opts.extended
        ? [`Unwrap at least ${nativeToken(network, amountMin)}${recipientText(humanizerInfo, recipient, txn.from)}`]
        : toExtendedUnwrap('Unwrap at least', network, amountMin, recipientText(humanizerInfo,recipient, txn.from, true))
    },
  }
}

const uniUniversalRouter = (humanizerInfo) => {
  const ifaceUniversalRouter  = new Interface(humanizerInfo.abis.UniswapUniversalRouter)
  
  return {
    [ifaceUniversalRouter.getSighash('execute(bytes calldata commands, bytes[] calldata inputs, uint256 deadline)')]: (txn, network, opts = {}) => {
      const [ commands, inputs, deadline ] = ifaceUniversalRouter.parseTransaction(txn).args
      const arrCommands = arrayify(commands)
      let parsedCommands = []
      arrCommands.forEach(item => parsedCommands.push(hexlify([item])))
      
      let parsed = []
      parsedCommands.forEach((command, index) => {
        if (command === COMMANDS.V3_SWAP_EXACT_IN) {
          const { inputsDetails } = COMMANDS_DESCRIPTIONS.V3_SWAP_EXACT_IN
          const params = extractParams(inputsDetails, inputs[index])
          const path = parsePath(params.path)
          
          parsed.push(!opts.extended 
            ? [`Swap ${token(humanizerInfo, path[0], params.amountIn)} for at least ${token(humanizerInfo, path[path.length - 1], params.amountOutMin)}${recipientText(humanizerInfo, txn.from, txn.from)}${deadlineText(deadline, opts.mined)}`]
            : toExtended('Swap', 'for at least', token(humanizerInfo, path[0], params.amountIn, true), token(humanizerInfo, path[path.length - 1], params.amountOutMin, true), recipientText(humanizerInfo, txn.from, txn.from, true), deadlineText(deadline, opts.mined))
          )
        } else if (command === COMMANDS.V3_SWAP_EXACT_OUT) {
          const { inputsDetails } = COMMANDS_DESCRIPTIONS.V3_SWAP_EXACT_OUT
          const params = extractParams(inputsDetails, inputs[index])
          const path = parsePath(params.path)

          parsed.push(!opts.extended 
            ? [`Swap up to ${token(humanizerInfo, path[path.length - 1], params.amountInMax)} for ${token(humanizerInfo, path[0], params.amountOut)}${recipientText(humanizerInfo, txn.from, txn.from)}${deadlineText(deadline, opts.mined)}`]
            : toExtended('Swap up to', 'for', token(humanizerInfo, path[path.length - 1], params.amountInMax, true), token(humanizerInfo, path[0], params.amountOut, true), recipientText(humanizerInfo, txn.from, txn.from, true), deadlineText(deadline, opts.mined))
          )
        } else if (command === COMMANDS.V2_SWAP_EXACT_IN) {
          const { inputsDetails } = COMMANDS_DESCRIPTIONS.V2_SWAP_EXACT_IN
          const params = extractParams(inputsDetails, inputs[index])
          const path = params.path
          
          parsed.push(!opts.extended 
            ? [`Swap ${token(humanizerInfo, path[0], params.amountIn)} for at least ${token(humanizerInfo, path[path.length - 1], params.amountOutMin)}${recipientText(humanizerInfo, txn.from, txn.from)}${deadlineText(deadline, opts.mined)}`]
            : toExtended('Swap', 'for at least', token(humanizerInfo, path[0], params.amountIn, true), token(humanizerInfo, path[path.length - 1], params.amountOutMin, true), recipientText(humanizerInfo, txn.from, txn.from, true), deadlineText(deadline, opts.mined))
          )
        } else if (command === COMMANDS.V2_SWAP_EXACT_OUT) {
          const { inputsDetails } = COMMANDS_DESCRIPTIONS.V2_SWAP_EXACT_OUT
          const params = extractParams(inputsDetails, inputs[index])
          const path = params.path

          parsed.push(!opts.extended 
            ? [`Swap up to ${token(humanizerInfo, path[0], params.amountInMax)} for ${token(humanizerInfo, path[path.length - 1], params.amountOut)}${recipientText(humanizerInfo, txn.from, txn.from)}${deadlineText(deadline, opts.mined)}`]
            : toExtended('Swap up to', 'for', token(humanizerInfo, path[0], params.amountInMax, true), token(humanizerInfo, path[path.length - 1], params.amountOut, true), recipientText(humanizerInfo, txn.from, txn.from, true), deadlineText(deadline, opts.mined))
          )
        } else if (command === COMMANDS.WRAP_ETH) {
          const { inputsDetails } = COMMANDS_DESCRIPTIONS.WRAP_ETH
          const params = extractParams(inputsDetails, inputs[index])
          
          parsed.push(!opts.extended 
            ? [`Wrap ${nativeToken(network, params.amountMin)} ${recipientText(humanizerInfo, params.recipient, txn.from)}`]
            : toExtendedUnwrap('Wrap', network, params.amountMin, recipientText(humanizerInfo, params.recipient, txn.from, true))
          )
        } else if (command === COMMANDS.UNWRAP_WETH) {
          const { inputsDetails } = COMMANDS_DESCRIPTIONS.UNWRAP_WETH
          const params = extractParams(inputsDetails, inputs[index])
          
          parsed.push(!opts.extended 
            ? [`Unwrap at least ${nativeToken(network, params.amountMin)}${recipientText(humanizerInfo, params.recipient, txn.from)}`]
            : toExtendedUnwrap('Unwrap at least', network, params.amountMin, recipientText(humanizerInfo, params.recipient, txn.from, true))
          )
        }
      })
      
      return parsed.flat()
    }
  }
}

const mapping = (humanizerInfo) => {
  return { 
    ...uniV2Mapping(humanizerInfo), 
    ...uniV3Mapping(humanizerInfo), 
    ...uniV32Mapping(humanizerInfo),
    ...uniUniversalRouter(humanizerInfo)
  }
} 
export default mapping