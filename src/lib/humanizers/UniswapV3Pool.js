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
    [ifaceV3.getSighash('multicall')]: (txn, network) => {
        const args = ifaceV3.parseTransaction(txn).args
        const calls = args[args.length - 1]
        const mappingResult = UniswapV3Pool(humanizerInfo)
        console.log("calls", calls)
        // @TODO: Multicall that outputs ETH should be detected as such and displayed as one action
        // the current verbosity of "Swap ..., unwrap WETH to ETH" will be a nice pedantic quirk
        const parsed = calls.map(data => {
          const sigHash = data.slice(0, 10)
          console.log("sigHash", sigHash)
          const humanizer = mappingResult[sigHash]
          return humanizer ? humanizer({ ...txn, data }, network) : null
        }).flat().filter(x => x)
        console.log('parsed V3', parsed)
        return parsed.length ? parsed : [`Unknown Uni V3 interaction`]
    },
    [ifaceV3.getSighash('mint')]: (txn, network, opts = {}) => {
        const [ params ] = ifaceV3.parseTransaction(txn).args
        // @TODO: consider fees
        return opts.extended 
          ? [`Supplying ${token(humanizerInfo, params.token0, params.amount0Desired)} and ${token(humanizerInfo, params.token1, params.amount1Desired)} ${recipientText(humanizerInfo, params.recipient, txn.from)}`]
          : toExtended('Supplying', 'and', token(humanizerInfo, params.token0, params.amount0Desired, true), token(humanizerInfo, params.token1, params.amount1Desired, true), recipientText(humanizerInfo, params.recipient, txn.from))
    },
    // TOD fix bellow
    [ifaceV3.getSighash('decreaseLiquidity')]: (txn, network, opts = {}) => {
      const [ params ] = ifaceV3.parseTransaction(txn).args
      console.log('-'.repeat(40))
      console.log('decreaseLiquidity')
      console.log('params', params)
      console.log('-'.repeat(40))
      
      // amount0Min: BigNumber {_hex: '0x00', _isBigNumber: true}
      // amount1Min: BigNumber {_hex: '0x00', _isBigNumber: true}
      // deadline: BigNumber {_hex: '0x63ca8bd9', _isBigNumber: true}
      // liquidity: BigNumber {_hex: '0x2e035871f8', _isBigNumber: true}
      // tokenId: BigNumber {_hex: '0x09e8ba', _isBigNumber: true}
      // @TODO: consider fees
      return opts.extended 
        ? [`Decrease Liquidity from ${token(humanizerInfo, params.tokenId, params.amount0Min)} to ${token(humanizerInfo, params.tokenId, params.amount1Min)}`]
        : toExtended('DecreaseLiquidity', 'and', token(humanizerInfo, params.tokenId, params.amount0Min, true), token(humanizerInfo, params.tokenId, params.amount1Min, true), [])
    },
    // [ifaceV3.getSighash('collect')]: (txn, network, opts = {}) => {
    //   const [ params ] = ifaceV3.parseTransaction(txn).args
    //   console.log('-'.repeat(40))
    //   console.log('collect')
    //   console.log('ifaceV3.parseTransaction(txn).args', ifaceV3.parseTransaction(txn).args)
    //   console.log('-'.repeat(40))
    //   // amount0Max: BigNumber {_hex: '0xffffffffffffffffffffffffffffffff', _isBigNumber: true}
    //   // amount1Max: BigNumber {_hex: '0xffffffffffffffffffffffffffffffff', _isBigNumber: true}
    //   // recipient: "0x0000000000000000000000000000000000000000"
    //   // tokenId: BigNumber {_hex: '0x09e8ba', _isBigNumber: true}
    //   // @TODO: consider fees
    //   return opts.extended 
    //     ? [`Supplying ${token(humanizerInfo, params.token0, params.amount0Desired)} and ${token(humanizerInfo, params.token1, params.amount1Desired)} ${recipientText(humanizerInfo, params.recipient, txn.from)}`]
    //     : toExtended('Supplying', 'and', token(humanizerInfo, params.token0, params.amount0Desired, true), token(humanizerInfo, params.token1, params.amount1Desired, true), recipientText(humanizerInfo, params.recipient, txn.from))
    // },
    // [ifaceV3.getSighash('unwrapWETH9')]: (txn, network, opts = {}) => {
    //   const [ params ] = ifaceV3.parseTransaction(txn).args
    //   console.log('-'.repeat(40))
    //   console.log('unwrapWETH9')
    //   console.log('ifaceV3.parseTransaction(txn).args', ifaceV3.parseTransaction(txn).args)
    //   console.log('-'.repeat(40))
    //   // amountMinimum: BigNumber {_hex: '0x00', _isBigNumber: true}
    //   // recipient: "0x8D230560d5d68D6027dc1e721cE75ec9dE4d8443"
    //   // @TODO: consider fees
    //   return opts.extended 
    //     ? [`Supplying ${token(humanizerInfo, params.token0, params.amount0Desired)} and ${token(humanizerInfo, params.token1, params.amount1Desired)} ${recipientText(humanizerInfo, params.recipient, txn.from)}`]
    //     : toExtended('Supplying', 'and', token(humanizerInfo, params.token0, params.amount0Desired, true), token(humanizerInfo, params.token1, params.amount1Desired, true), recipientText(humanizerInfo, params.recipient, txn.from))
    // },
    // [ifaceV3.getSighash('sweepToken')]: (txn, network, opts = {}) => {
    //   const [ params ] = ifaceV3.parseTransaction(txn).args
    //   console.log('-'.repeat(40))
    //   console.log('sweepToken')
    //   console.log('ifaceV3.parseTransaction(txn).args', ifaceV3.parseTransaction(txn).args)
    //   console.log('-'.repeat(40))

    //   // amountMinimum: BigNumber {_hex: '0x00', _isBigNumber: true}
    //   // recipient: "0x8D230560d5d68D6027dc1e721cE75ec9dE4d8443"
    //   // token: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"
    //   // @TODO: consider fees
    //   return opts.extended 
    //     ? [`Supplying ${token(humanizerInfo, params.token0, params.amount0Desired)} and ${token(humanizerInfo, params.token1, params.amount1Desired)} ${recipientText(humanizerInfo, params.recipient, txn.from)}`]
    //     : toExtended('Supplying', 'and', token(humanizerInfo, params.token0, params.amount0Desired, true), token(humanizerInfo, params.token1, params.amount1Desired, true), recipientText(humanizerInfo, params.recipient, txn.from))
    // },
    
  
    // [ifaceV3.getSighash('refundETH')]: (txn, network, opts = {}) => {
        
    //     const test = ifaceV3.parseTransaction(txn).args
    //     const [ params ] = ifaceV3.parseTransaction(txn).args
    //     console.log('TEST', test)
        
    //     // @TODO: consider fees
    //     return !opts.extended 
    //       ? [`Supplying ${token(humanizerInfo, params.token0, params.amount0Desired)} and ${token(humanizerInfo, params.token1, params.amount1Desired)} ${recipientText(humanizerInfo, params.recipient, txn.from)}`]
    //       : toExtended('Supplying', 'and', token(humanizerInfo, params.token0, params.amount0Desired, true), token(humanizerInfo, params.token1, params.amount1Desired, true), recipientText(humanizerInfo, params.recipient, txn.from))
    // }
  }
}

export default UniswapV3Pool