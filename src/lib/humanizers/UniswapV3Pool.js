/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-nested-ternary */
/* eslint-disable import/no-cycle */
import { Interface } from 'ethers/lib/utils'
import { nativeToken, token, getName } from 'lib/humanReadableTransactions'
import { getInterval } from './MeanFinance'

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
  // DCAhub comes from mean finance
  const DCAHubCompanion = new Interface(humanizerInfo.abis.DCAHubCompanion)
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
      if (orderType === 4) {
        return !opts.extended
          ? [
              `Close ${isLong ? 'long' : 'short'} position with ${token(
                humanizerInfo,
                addresses[4],
                -1
              )} in ${getName(txn.to)}`
            ]
          : [
              [
                `Close ${isLong ? 'long' : 'short'} position`,
                'with',
                { type: 'token', ...token(humanizerInfo, addresses[4], 0, true) },
                'in',
                { type: 'address', address: txn.to, name: getName(humanizerInfo, txn.to) }
              ]
            ]
      }
      return !opts.extended
        ? [
            `Open ${isLong ? 'long' : 'short'} position with collateral ${token(
              humanizerInfo,
              addresses[4],
              -1
            )} in ${getName(txn.to)}`
          ]
        : [
            [
              `Open ${isLong ? 'long' : 'short'} position`,
              'with collateral',
              { type: 'token', ...token(humanizerInfo, addresses[4], 0, true) },
              'in',
              { type: 'address', address: txn.to, name: getName(humanizerInfo, txn.to) }
            ]
          ]
    },
    // DCAHub companion can be moved to mean finance and exported to be applied also here
    [DCAHubCompanion.getSighash('terminate')]: (txn, network, opts = { extended: true }) => {
      const { _hub, _positionId, _recipientUnswapped, _recipientSwapped } =
        DCAHubCompanion.parseTransaction(txn).args
      return !opts.extended
        ? [`Terminate position ${_positionId} on ${getName(humanizerInfo, _hub)}`]
        : [
            [
              'Terminate position',
              `${_positionId}`,
              'on',
              { type: 'address', address: _hub, name: getName(humanizerInfo, _hub) }
            ]
          ]
    },
    [DCAHubCompanion.getSighash('runSwap')]: (txn, network, opts = { extended: true }) => {
      const { _allowanceToken, _value, _swapData, _tokenOut, _minTokenOut } =
        DCAHubCompanion.parseTransaction(txn).args
      const tokenA =
        Number(_allowanceToken) === 0
          ? nativeToken(network, _value, opts.extended)
          : token(humanizerInfo, _allowanceToken, _value, opts.extended)
      const tokenB =
        Number(_tokenOut) === 0
          ? nativeToken(network, _minTokenOut, opts.extended)
          : token(humanizerInfo, _tokenOut, _minTokenOut, opts.extended)
      return !opts.extended
        ? [`Swap ${tokenA} for ${tokenB}`]
        : [['Swap', { type: 'token', ...tokenA }, 'for', { type: 'token', ...tokenB }]]
    },
    [DCAHubCompanion.getSighash('permitTakeFromCaller')]: (
      txn,
      network,
      opts = { extended: true }
    ) => {
      const { _token, _amount } = DCAHubCompanion.parseTransaction(txn).args
      return !opts.extended
        ? [
            `Send ${token(humanizerInfo, _token, _amount)} ${
              txn.value === '0x' || txn.value === '0x0'
                ? ''
                : `and ${nativeToken(network, txn.value)}`
            } to ${getName(humanizerInfo, txn.to)}`
          ]
        : [
            [
              'Send',
              {
                type: 'token',
                ...token(humanizerInfo, _token, _amount, true)
              },
              ...(txn.value === '0x' || txn.value === '0x0'
                ? []
                : ['and', { type: 'token', ...nativeToken(network, txn.value, true) }]),
              'to',
              { type: 'address', address: txn.to, name: getName(humanizerInfo, txn.to) }
            ]
          ]
    },
    [DCAHubCompanion.getSighash('sendBalanceOnContractToRecipient')]: (
      txn,
      network,
      opts = { extended: true }
    ) => {
      const { _token, _recipient } = DCAHubCompanion.parseTransaction(txn).args
      const displayableToken =
        Number(_token) === 0
          ? nativeToken(network, txn.value, opts.extended)
          : token(humanizerInfo, _token, 0, opts.extended)
      if (_recipient !== txn.from)
        return !opts.extended
          ? [`Pull ${displayableToken}  from ${getName(txn.to)}to ${getName(_recipient)}`]
          : [
              [
                'Pull all',
                { type: 'token', ...displayableToken },
                'from',
                { type: 'address', address: txn.to, name: getName(humanizerInfo, txn.to) },
                'to',
                { type: 'address', address: _recipient, name: getName(humanizerInfo, _recipient) }
              ]
            ]
      return !opts.extended
        ? [`Withdraw all ${displayableToken}  from ${getName(txn.to)}`]
        : [
            [
              'Withdraw all',
              { type: 'token', ...displayableToken },
              'from',
              { type: 'address', address: txn.to, name: getName(humanizerInfo, txn.to) }
            ]
          ]
    },
    [DCAHubCompanion.getSighash('depositWithBalanceOnContract')]: (
      txn,
      network,
      opts = { extended: true }
    ) => {
      const {
        _hub,
        _from,
        _to,
        _amountOfSwaps,
        _swapInterval,
        _owner,
        _permissions,
        _miscellaneous
      } = DCAHubCompanion.parseTransaction(txn).args
      return !opts.extended
        ? ['watafak']
        : [
            [
              'and swap',
              'the resulting amount of',
              {
                type: 'token',
                ...token(humanizerInfo, _from, 0, true)
              },
              'for',
              {
                type: 'token',
                ...token(humanizerInfo, _to, 0, true)
              },
              `Split into ${_amountOfSwaps} swaps over ${getInterval(
                _swapInterval * _amountOfSwaps
              )}`,
              'via',
              {
                type: 'address',
                address: txn.to,
                name: getName(humanizerInfo, _hub)
              }
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
