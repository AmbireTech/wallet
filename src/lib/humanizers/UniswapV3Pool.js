import { Interface } from 'ethers/lib/utils'
import { nativeToken, token, getName } from 'lib/humanReadableTransactions'

const recipientText = (humanizerInfo, recipient, txnFrom, extended = false) =>
  recipient.toLowerCase() === txnFrom.toLowerCase()
    ? !extended
      ? ''
      : []
    : !extended
    ? ` and send it to ${recipient}`
    : [
        'and send it to',
        { type: 'address', address: recipient, name: getName(humanizerInfo, recipient) }
      ]

const toExtendedUnwrap = (action, network, amount, recipient = []) => {
  return [
    [
      action,
      {
        type: 'token',
        ...nativeToken(network, amount, true)
      },
      ...recipient
    ]
  ]
}

const toExtended = (action, word, fromToken, toToken, recipient = [], expires = []) => {
  return [
    [
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
    ]
  ]
}

const UniswapV3Pool = (humanizerInfo) => {
  const ifaceV3 = new Interface(humanizerInfo.abis.UniswapV3Pool)
  const exchangeRouter = new Interface(humanizerInfo.abis.ExchangeRouter)

  return {
    [ifaceV3.getSighash('multicall')]: (txn, network) => {
      const args = ifaceV3.parseTransaction(txn).args
      const calls = args[args.length - 1]
      const mappingResult = UniswapV3Pool(humanizerInfo)
      // @TODO: Multicall that outputs ETH should be detected as such and displayed as one action
      // the current verbosity of "Swap ..., unwrap WETH to ETH" will be a nice pedantic quirk
      const parsed = calls
        .map((data) => {
          const sigHash = data.slice(0, 10)
          const humanizer = mappingResult[sigHash]
          return humanizer ? humanizer({ ...txn, data }, network) : null
        })
        .flat()
        .filter((x) => x)
      return parsed.length ? parsed : ['Unknown Uniswap V3 Pool interaction']
    },
    [ifaceV3.getSighash('mint')]: (txn, network, opts = { extended: true }) => {
      const [params] = ifaceV3.parseTransaction(txn).args

      return !opts.extended
        ? [
            `Supplying ${token(humanizerInfo, params.token0, params.amount0Desired)} and ${token(
              humanizerInfo,
              params.token1,
              params.amount1Desired
            )} ${recipientText(humanizerInfo, params.recipient, txn.from)}`
          ]
        : toExtended(
            'Supplying',
            'and',
            token(humanizerInfo, params.token0, params.amount0Desired, true),
            token(humanizerInfo, params.token1, params.amount1Desired, true),
            recipientText(humanizerInfo, params.recipient, txn.from, true)
          )
    },
    [exchangeRouter.getSighash('sendWnt')]: (txn, network, opts = { extended: true }) => {
      const args = exchangeRouter.parseTransaction(txn).args
      return !opts.extended
        ? [
            [
              `Wrap and send ${nativeToken(network, args.amount)} to ${getName(
                humanizerInfo,
                args.receiver
              )}`
            ]
          ]
        : [
            [
              'Wrap and send',
              { type: 'token', ...nativeToken(network, args.amount, true) },
              'to',
              {
                type: 'address',
                address: args.receiver,
                name: getName(humanizerInfo, args.receiver)
              }
            ]
          ]
    },
    [exchangeRouter.getSighash('sendTokens')]: (txn, network, opts = { extended: true }) => {
      const args = exchangeRouter.parseTransaction(txn).args
      return !opts.extended
        ? [
            [
              `Send ${token(humanizerInfo, args.token, args.amount)} to ${getName(
                humanizerInfo,
                args.receiver
              )}`
            ]
          ]
        : [
            [
              'Send',
              { type: 'token', ...token(humanizerInfo, args.token, args.amount, true) },
              'to',
              {
                type: 'address',
                address: args.receiver,
                name: getName(humanizerInfo, args.receiver)
              }
            ]
          ]
    },
    [exchangeRouter.getSighash('createOrder')]: (txn, network, opts = { extended: true }) => {
      const { params } = exchangeRouter.parseTransaction(txn).args
      const [
        addresses,
        numbers,
        orderType,
        decreasePositionSwapType,
        isLong,
        shouldUnwrapNativeToken,
        referralCode
      ] = params
      return !opts.extended
        ? [`Create order for ${token(humanizerInfo, addresses[4], -1)}`]
        : [
            [
              'Create order',
              'for',
              { type: 'token', ...token(humanizerInfo, addresses[4], -1, true) }
            ]
          ]
    },
    [ifaceV3.getSighash('unwrapWETH9')]: (txn, network, opts = { extended: true }) => {
      const [amountMinimum, recipient] = ifaceV3.parseTransaction(txn).args

      return !opts.extended
        ? [
            `Unwrap at least ${nativeToken(network, amountMinimum)}${recipientText(
              humanizerInfo,
              recipient,
              txn.from
            )}`
          ]
        : toExtendedUnwrap(
            'Unwrap at least',
            network,
            amountMinimum,
            recipientText(humanizerInfo, recipient, txn.from, true)
          )
    },
    [ifaceV3.getSighash('sweepToken')]: (txn, network, opts = { extended: true }) => {
      const [tokenA, amountMinimum, recipient] = ifaceV3.parseTransaction(txn).args

      return !opts.extended
        ? [
            `Sweep token ${token(humanizerInfo, tokenA, amountMinimum)} ${recipientText(
              humanizerInfo,
              recipient,
              txn.from
            )}`
          ]
        : toExtended(
            'Sweep token',
            '',
            token(humanizerInfo, tokenA, amountMinimum, true),
            recipientText(humanizerInfo, recipient, txn.from, true)
          )
    }
  }
}

export default UniswapV3Pool
