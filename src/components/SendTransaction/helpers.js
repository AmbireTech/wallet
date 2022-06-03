// It costs around 19k to send a token, if that token was interacted with before in the same transaction,
// because of SLOAD costs - they depend on whether a slot has been read
// however, it costs 30k if the token has not been interacted with
// we may decrease it a bit and lean on the relayer failsafe values (cfg.gasAddedOnEstimate) later on
const ADDED_GAS_TOKEN = 30000
const ADDED_GAS_NATIVE = 12000

export function isTokenEligible(token, speed, estimation, isGasTankEnabled) {
  if (estimation?.relayerless && token?.address === '0x0000000000000000000000000000000000000000') return true
  if (!token) return false
  const { feeInFeeToken } = getFeesData(token, estimation, speed, isGasTankEnabled)
  const balanceInFeeToken = (parseInt(token.balance) / Math.pow(10, token.decimals))
  return balanceInFeeToken > feeInFeeToken
}

export function getAddedGas(token) {
  return !token?.address || token?.address === '0x0000000000000000000000000000000000000000'
    ? ADDED_GAS_NATIVE
    : ADDED_GAS_TOKEN
}

// can't think of a less funny name for that
export function getFeePaymentConsequences(token, estimation, isGasTankEnabled) {
  // Relayerless mode
  if (!estimation?.feeInUSD || !token) return { multiplier: 1, addedGas: 0 }
  // Relayer mode
  const addedGas = getAddedGas(token)
  // If Gas Tank enabled
  if (!!isGasTankEnabled) return { addedGas: 0, multiplier: 1 }

  return {
    // otherwise we get very long floating point numbers with trailing .999999
    multiplier: parseFloat(((estimation.gasLimit + addedGas) / estimation.gasLimit).toFixed(4)),
    addedGas
  }
}

const contractErrors = ['caller is a contract', 'contract not allowed', 'contract not supported', 'No contractz allowed', /*no */'contracts allowed', /* c or C*/'ontract is not allowed']

export function mapTxnErrMsg(msg) {
  if (!msg) return
  if (msg.includes('Router: EXPIRED')) return 'Swap expired'
  if (msg.includes('Router: INSUFFICIENT_OUTPUT_AMOUNT')) return 'Swap will suffer slippage higher than your requirements'
  if (msg.includes('INSUFFICIENT_PRIVILEGE')) return 'Your signer address is not authorized.'
  if (contractErrors.find(contractMsg => msg.includes(contractMsg))) return 'This dApp does not support smart wallets.'
  return msg
}

export function getErrHint(msg) {
  if (!msg) return
  if (msg.includes('Router: EXPIRED')) return 'Try performing the swap again'
  if (msg.includes('Router: INSUFFICIENT_OUTPUT_AMOUNT')) return 'Try performing the swap again or increase your slippage requirements'
  if (msg.includes('INSUFFICIENT_PRIVILEGE')) return 'If you set a new signer for this account, try re-adding the account.'
  if (contractErrors.find(contractMsg => msg.includes(contractMsg))) return 'Contact the dApp developers to tell them to implement smart wallet support by not blocking contract interactions and/or implementing EIP1271.'
  return 'Sending this transaction batch would have resulted in an error, so we prevented it.'
}

export function toHexAmount(amnt, decimals) {
  return '0x' + Math.round(amnt * Math.pow(10, decimals)).toString(16)
}

export function getDiscountApplied(amnt, discount = 0) {
  if (!discount) return 0
  if (!amnt) return 0
  if (discount === 1) return amnt
  return amnt / (1 - discount) * discount
}

// Returns feeToken data with all multipliers applied
export function getFeesData(feeToken, estimation, speed, isGasTankEnabled) {
  console.log('feeToken',feeToken)
  const { addedGas, multiplier } = getFeePaymentConsequences(feeToken, estimation, isGasTankEnabled)
  const savedGas = getAddedGas(feeToken)
  const discountMultiplier = 1 - (feeToken?.discount || 0)
  const totalMultiplier = multiplier * discountMultiplier
  const nativeRate = feeToken?.nativeRate || 1

  const feeInNative = estimation.customFee
    ? ((estimation.customFee * discountMultiplier) / nativeRate)
    : estimation.feeInNative[speed] * totalMultiplier

  const feeInUSD = !isNaN(estimation.nativeAssetPriceInUSD) ? feeInNative * estimation.nativeAssetPriceInUSD : undefined

  const feeInFeeToken = feeInNative * nativeRate

  return {
    feeInNative,
    feeInUSD,
    feeInFeeToken,
    addedGas, // use it bundle data
    savedGas
  }
}
