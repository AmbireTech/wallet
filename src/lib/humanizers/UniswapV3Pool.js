import { Interface } from 'ethers/lib/utils'
import { nativeToken, token, getName } from 'lib/humanReadableTransactions'

const recipientText = (humanizerInfo, recipient, txnFrom, extended = false) => recipient.toLowerCase() === txnFrom.toLowerCase()
  ? !extended ? ``: [] : !extended ? ` and send it to ${recipient}` : ['and send it to', { type: 'address', address: recipient, name: getName(humanizerInfo, recipient) }]

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

const toExtended = (action, word, fromToken, toToken, recipient = [], expires = []) => {
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


const UniswapV3Pool = (humanizerInfo) => {
  const ifaceV3 = new Interface(humanizerInfo.abis.UniswapV3Pool)
  
  return {
    [ifaceV3.getSighash('multicall')]: (txn, network, opts = {}) => {
      const args = ifaceV3.parseTransaction(txn).args
      const calls = args[args.length - 1]
      const mappingResult = UniswapV3Pool(humanizerInfo)
      
      // @TODO: Multicall that outputs ETH should be detected as such and displayed as one action
      // the current verbosity of "Swap ..., unwrap WETH to ETH" will be a nice pedantic quirk
      let parsed
      if (calls.length === 2) {
        const mergedCalls = calls.map(data => {
          const sigHash = data.slice(0, 10)
          const humanizer = mappingResult[sigHash]
          const result = humanizer ? humanizer({ ...txn, data }, network, opts) : null
          
          return result
        })
        
        parsed = !opts.extended 
          ? [`${mergedCalls[0].words[0]} ${token(humanizerInfo, mergedCalls[0].params.tknIn, mergedCalls[0].params.amount)} ${mergedCalls[0].words[1]} ${nativeToken(network, mergedCalls[1].params)}`] 
          : toExtended(
              mergedCalls[0].words[0],
              mergedCalls[0].words[1], 
              token(humanizerInfo, mergedCalls[0].params.tknIn, mergedCalls[0].params.amount, true),
              nativeToken(network, mergedCalls[1].params, true)
            )
      } else {
        parsed = calls.map(data => {
          const sigHash = data.slice(0, 10)
          const humanizer = mappingResult[sigHash]
          const result = humanizer ? humanizer({ ...txn, data }, network, opts) : null
          
          return result ? result.parsed : null
        }).flat().filter(x => x)
      }
      
      return (parsed.length ? parsed : [`Unknown Uni V3 interaction`])
    },
    [ifaceV3.getSighash('mint')]: (txn, network, opts = {}) => {
        const [ params ] = ifaceV3.parseTransaction(txn).args
        // @TODO: consider fees
        return opts.extended 
          ? [`Supplying ${token(humanizerInfo, params.token0, params.amount0Desired)} and ${token(humanizerInfo, params.token1, params.amount1Desired)} ${recipientText(humanizerInfo, params.recipient, txn.from)}`]
          : toExtended('Supplying', 'and', token(humanizerInfo, params.token0, params.amount0Desired, true), token(humanizerInfo, params.token1, params.amount1Desired, true), recipientText(humanizerInfo, params.recipient, txn.from))
    },
    [ifaceV3.getSighash('unwrapWETH9')]: (txn, network, opts = {}) => {
      const [ amountMinimum, recipient ] = ifaceV3.parseTransaction(txn).args
     
      return {
        parsed: !opts.extended
          ? [`Unwrap at least ${nativeToken(network, amountMinimum)}${recipientText(humanizerInfo,recipient, txn.from)}`]
          : toExtendedUnwrap('Unwrap at least', network, amountMinimum, recipientText(humanizerInfo,recipient, txn.from, true)),
        params: amountMinimum,
        words: ['Unwrap at least']
      }
    },
    [ifaceV3.getSighash('sweepToken')]: (txn, network, opts = {}) => {
      const [ tokenA, amountMinimum, recipient ] =  ifaceV3.parseTransaction(txn).args
      
      return {
        parsed: !opts.extended
          ? [`Sweep token ${token(humanizerInfo, tokenA, amountMinimum)} ${recipientText(humanizerInfo, recipient, txn.from)}`]
          : toExtended('Sweep token', '', token(humanizerInfo, tokenA, amountMinimum, true), recipientText(humanizerInfo, recipient, txn.from, true)),
        params: { amount: amountMinimum, tknIn: tokenA },
        words: ['Sweep token', '']
      }
    }
  }
}

export default UniswapV3Pool