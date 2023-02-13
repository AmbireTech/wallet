import { Interface } from 'ethers/lib/utils'
import { nativeToken, token, getName } from 'lib/humanReadableTransactions'

const recipientText = (humanizerInfo, recipient, txnFrom, extended = false) => recipient.toLowerCase() === txnFrom.toLowerCase()
  ? !extended ? ``: [] : !extended ? ` and send it to ${recipient}` : ['and send it to', { type: 'address', address: recipient, name: getName(humanizerInfo, recipient) }]

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

const UniswapV3Pool = (humanizerInfo) => {
  const ifaceV3 = new Interface(humanizerInfo.abis.UniswapV3Pool)
  
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
      return parsed.length ? parsed : [`Unknown Uniswap V3 Pool interaction`]
    },
    [ifaceV3.getSighash('mint')]: (txn, network, opts = {}) => {
        const [ params ] = ifaceV3.parseTransaction(txn).args
        // @TODO: consider fees
        return !opts.extended 
          ? [`Supplying ${token(humanizerInfo, params.token0, params.amount0Desired)} and ${token(humanizerInfo, params.token1, params.amount1Desired)} ${recipientText(humanizerInfo, params.recipient, txn.from)}`]
          : toExtended('Supplying', 'and', token(humanizerInfo, params.token0, params.amount0Desired, true), token(humanizerInfo, params.token1, params.amount1Desired, true), recipientText(humanizerInfo, params.recipient, txn.from))
    },
    [ifaceV3.getSighash('unwrapWETH9')]: (txn, network, opts = {}) => {
      const [ amountMinimum, recipient ] = ifaceV3.parseTransaction(txn).args
     
      return !opts.extended
        ? [`Unwrap at least ${nativeToken(network, amountMinimum)}${recipientText(humanizerInfo,recipient, txn.from)}`]
        : toExtendedUnwrap('Unwrap at least', network, amountMinimum, recipientText(humanizerInfo,recipient, txn.from, true))
    },
    [ifaceV3.getSighash('sweepToken')]: (txn, network, opts = {}) => {
      const [ tokenA, amountMinimum, recipient ] =  ifaceV3.parseTransaction(txn).args
      
      return !opts.extended
          ? [`Sweep token ${token(humanizerInfo, tokenA, amountMinimum)} ${recipientText(humanizerInfo, recipient, txn.from)}`]
          : toExtended('Sweep token', '', token(humanizerInfo, tokenA, amountMinimum, true), recipientText(humanizerInfo, recipient, txn.from, true))
    }
  }
}

export default UniswapV3Pool