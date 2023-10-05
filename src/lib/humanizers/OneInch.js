import { Interface } from 'ethers/lib/utils'
import { nativeToken, token } from 'lib/humanReadableTransactions'

const parseZeroAddressIfNeeded = (address) => {
  return address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
    ? '0x0000000000000000000000000000000000000000'
    : address
}

const toExtended = (action, word, fromToken) => {
  return [
    [
      action,
      {
        type: 'token',
        ...fromToken
      },
      word
    ]
  ]
}

const OneInchMapping = (humanizerInfo) => {
  const iface = new Interface(humanizerInfo.abis.Swappin)

  return {
    [iface.getSighash('swap')]: (txn, network, { extended = false }) => {
      const { desc } = iface.parseTransaction(txn).args
      const srcToken = parseZeroAddressIfNeeded(desc.srcToken)
      const dstToken = parseZeroAddressIfNeeded(desc.dstToken)
      const paymentSrcToken =
        Number(srcToken) === 0
          ? nativeToken(network, desc.amount, extended)
          : token(humanizerInfo, srcToken, desc.amount, extended)
      const paymentToken =
        Number(dstToken) === 0
          ? nativeToken(network, desc.minReturnAmount, extended)
          : token(humanizerInfo, dstToken, desc.minReturnAmount, extended)

      return !extended
        ? [`Swap ${paymentSrcToken} for at least ${paymentToken} on 1inch`]
        : [
            [
              'Swap',
              {
                type: 'token',
                ...paymentSrcToken
              },
              'for at least',
              {
                type: 'token',
                ...paymentToken
              },
              'on 1inch'
            ]
          ]
    },
    [iface.getSighash('unoswap')]: (txn, network, { dstToken = '', extended = false }) => {
      const { amount, minReturn, srcToken } = iface.parseTransaction(txn).args

      const srcToken1 = parseZeroAddressIfNeeded(srcToken)
      const dstToken2 = parseZeroAddressIfNeeded(dstToken)
      const paymentSrcToken =
        Number(srcToken1) === 0
          ? nativeToken(network, amount, extended)
          : token(humanizerInfo, srcToken1, amount, extended)
      const paymentToken =
        Number(dstToken2) === 0
          ? nativeToken(network, minReturn, extended)
          : token(humanizerInfo, dstToken2, minReturn, extended)

      return !extended
        ? [`Swap ${paymentSrcToken} for at least ${paymentToken} on 1inch`]
        : [
            [
              'Swap',
              {
                type: 'token',
                ...paymentSrcToken
              },
              'for at least',
              {
                type: 'token',
                ...paymentToken
              },
              'on 1inch'
            ]
          ]
    }
  }
}

const SwappinMapping = (humanizerInfo) => {
  const SwappinInterface = new Interface(humanizerInfo.abis.SwappinGatewayV2)
  const SwappinNFTInterface = new Interface(humanizerInfo.abis.SwappinNFTV2)

  return {
    [SwappinInterface.getSighash('execute')]: (txn, network, opts) => {
      const data = SwappinInterface.parseTransaction(txn).args
      const batchedTransactions = data[0]

      const sigHash = batchedTransactions[1].data.slice(0, 10)
      const swappinNFTMintSigHash = SwappinNFTInterface.getSighash('mint')
      const swappinNFTRedeemSigHash = SwappinNFTInterface.getSighash('redeem')

      const firstTxData = batchedTransactions[0]

      const tokenAddr = `0x${firstTxData.data.slice(730, 770)}`
      const isNativeToken = tokenAddr === `0x${'0'.repeat(40)}`
      const tokenItem = isNativeToken
        ? nativeToken(network, 0, opts.extended)
        : token(humanizerInfo, tokenAddr, 0, opts.extended)

      if (swappinNFTMintSigHash === sigHash) {
        return !opts.extended
          ? [`Swap ${tokenItem} for a Swappin.gifts AGIFT gift card`]
          : toExtended('Swap', 'for a Swappin.gifts AGIFT gift card', tokenItem)
      }

      if (swappinNFTRedeemSigHash === sigHash) {
        return !opts.extended
          ? [`Swap ${tokenItem} and your Swappin.gift AGIFT gift card for a new gift card`]
          : toExtended(
              'Swap',
              'and your Swappin.gift AGIFT gift card for a new gift card',
              tokenItem
            )
      }

      return !opts.extended
        ? [`Swap ${tokenItem} for a gift card on Swappin.gifts`]
        : toExtended('Swap', 'for a gift card on Swappin.gifts', tokenItem)
    },
    [SwappinInterface.getSighash('payWithAnyToken')]: (txn, network, opts) => {
      const { swapInfo } = SwappinInterface.parseTransaction(txn).args
      let tokenFromItem = 'Unknown token'

      if (typeof swapInfo?.[0]?.tokenFrom === 'string') {
        const { tokenFrom, amountFrom } = swapInfo[0]
        const isNativeToken = tokenFrom === `0x${'0'.repeat(40)}`

        tokenFromItem = isNativeToken
          ? nativeToken(network, amountFrom, opts.extended)
          : token(humanizerInfo, tokenFrom, amountFrom, opts.extended)
      }

      return !opts.extended
        ? [`Swap ${tokenFromItem} for a gift card on Swappin.gifts`]
        : toExtended('Swap', 'for a gift card on Swappin.gifts', tokenFromItem)
    }
  }
}

const mapping = (humanizerInfo) => {
  return {
    ...OneInchMapping(humanizerInfo),
    ...SwappinMapping(humanizerInfo)
  }
}

export default mapping
