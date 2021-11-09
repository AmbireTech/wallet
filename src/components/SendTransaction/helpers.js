const ADDED_GAS_TOKEN = 20000
const ADDED_GAS_NATIVE = 10000

export function isTokenEligible (token, speed, estimation) {
  const min = token.isStable ? estimation.feeInUSD[speed] : estimation.feeInNative[speed]
  return parseInt(token.balance) / Math.pow(10, token.decimals) > min
}

// can't think of a less funny name for that
export function getFeePaymentConsequences (token, estimation) {
  // Relayerless mode
  if (!estimation.feeInUSD) return { multiplier: 1, addedGas: 0 }
  // Relayer mode
  const addedGas = !token.address || token.address === '0x0000000000000000000000000000000000000000'
    ? ADDED_GAS_NATIVE
    : ADDED_GAS_TOKEN
  return {
    multiplier: (estimation.gasLimit + addedGas) / estimation.gasLimit,
    addedGas
  }
}

export function mapTxnErrMsg(msg) {
  if (!msg) return
  if (msg.includes('Router: EXPIRED')) return 'Swap expired'
  if (msg.includes('Router: INSUFFICIENT_OUTPUT_AMOUNT')) return 'Swap will suffer slippage higher than your requirements'
  return msg
}

export function getErrHint(msg) {
  if (!msg) return
  if (msg.includes('Router: EXPIRED')) return 'Try performing the swap again'
  if (msg.includes('Router: INSUFFICIENT_OUTPUT_AMOUNT')) return 'Try performing the swap again or increase your slippage requirements'
  return 'Sending this transaction batch will result in an error.'
}