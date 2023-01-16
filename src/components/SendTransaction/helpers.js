import { Bundle } from 'adex-protocol-eth/js'
import { toBundleTxn } from 'ambire-common/src/services/requestToBundleTxn'
import accountPresets from 'ambire-common/src/constants/accountPresets'
import { ethers } from 'ethers'
// It costs around 19k to send a token, if that token was interacted with before in the same transaction,
// because of SLOAD costs - they depend on whether a slot has been read
// however, it costs 30k if the token has not been interacted with
// we may decrease it a bit and lean on the relayer failsafe values (cfg.gasAddedOnEstimate) later on
const ADDED_GAS_TOKEN = 30000
const ADDED_GAS_NATIVE = 12000

export function isTokenEligible(token, speed, estimation, isGasTankEnabled, network) {
  if (estimation?.relayerless && token?.address === '0x0000000000000000000000000000000000000000') return true
  if (!token) return false
  const { feeInFeeToken } = getFeesData(token, estimation, speed, isGasTankEnabled, network)
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

const contractErrors = ['caller is a contract', 'caller is another contract', 'contract not allowed', 'contract not supported', 'No contractz allowed', 'o contracts', /*no */'contracts allowed', /* c or C*/'ontract is not allowed', 'aller must be user', 'aller must be a user', 'ontract call not allowed']

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
  if (contractErrors.find(contractMsg => msg.includes(contractMsg))) {
    return 'WARNING! We detected that this dApp intentionally blocks smart contract calls. This is a highly disruptive practice, as it breaks support for all smart wallets (Ambire, Gnosis Safe and others). We recommend you report this to the dApp ASAP and ask them to fix it.'
    // return 'This dApp does not support smart wallets or purposefully excludes them. Contact the dApp developers to tell them to implement smart wallets by not blocking contract interactions and/or implementing EIP1271.'
  }
  return 'Sending this transaction batch would have resulted in an error, so we prevented it.'
}

export function checkIfDAppIncompatible(msg) {
  return contractErrors.find(contractMsg => msg.includes(contractMsg))
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
export function getFeesData(feeToken, estimation, speed, isGasTankEnabled, network) {
  const { addedGas, multiplier } = getFeePaymentConsequences(feeToken, estimation, isGasTankEnabled)
  const savedGas = getAddedGas(feeToken)
  const discountMultiplier = 1 - (feeToken?.discount || 0)
  const totalMultiplier = multiplier * discountMultiplier
  const nativeRate = feeToken?.nativeRate || 1
  const isCrossChainNativeSelected = isGasTankEnabled && feeToken.address === '0x0000000000000000000000000000000000000000' && (network.id !== feeToken.network)
  const feeInNative = estimation.customFee
    ? ((estimation.customFee * discountMultiplier) / nativeRate)
    : !isCrossChainNativeSelected ? 
        estimation.feeInNative[speed] * totalMultiplier : 
        (((estimation.feeInNative[speed] * totalMultiplier) / nativeRate) * estimation.nativeAssetPriceInUSD) / feeToken.price
  const feeInUSD = !isNaN(estimation.nativeAssetPriceInUSD) ? 
    !isCrossChainNativeSelected ? 
      feeInNative * estimation.nativeAssetPriceInUSD : 
      feeInNative * feeToken.price : 
    undefined
  const feeInFeeToken = feeInNative * nativeRate

  return {
    feeInNative,
    feeInUSD,
    feeInFeeToken,
    addedGas, // use it bundle data
    savedGas,
  }
}

export const getDefaultFeeToken = (remainingFeeTokenBalances, network, feeSpeed, estimation, currentAccGasTankState) => {
  const WALLET_TOKEN_SYMBOLS = ['xWALLET', 'WALLET']

  if(!remainingFeeTokenBalances?.length) {
    return { symbol: network.nativeAssetSymbol, decimals: 18, address: '0x0000000000000000000000000000000000000000' }
  }

  return remainingFeeTokenBalances
  .sort((a, b) =>
    (WALLET_TOKEN_SYMBOLS.indexOf(b?.symbol) - WALLET_TOKEN_SYMBOLS.indexOf(a?.symbol))
    || ((b?.discount || 0) - (a?.discount || 0))
    || a?.symbol.toUpperCase().localeCompare(b?.symbol.toUpperCase())
  )
  .find(token => isTokenEligible(token, feeSpeed, estimation, currentAccGasTankState, network))
  || remainingFeeTokenBalances[0]
}

export function makeBundle(account, networkId, requests) {
  const bundle = new Bundle({
    network: networkId,
    identity: account.id,
    // checking txn isArray because sometimes we receive txn in array from walletconnect. Also we use Array.isArray because txn object can have prop 0
    txns: requests.map(({ txn }) => toBundleTxn(Array.isArray(txn) ? txn[0] : txn, account.id)),
    signer: account.signer
  })
  bundle.extraGas = requests.map(x => x.extraGas || 0).reduce((a, b) => a + b, 0)
  bundle.requestIds = requests.map(x => x.id)

  // Attach bundle's meta
  if (requests.some(item => item.meta)) {
    bundle.meta = {}

    if (requests.some(item => item.meta?.addressLabel)) {
      bundle.meta.addressLabel = requests.map(x => !!x.meta?.addressLabel ? x.meta.addressLabel : { addressLabel: '', address: ''})
    }

    const xWalletReq = requests.find(x => x.meta?.xWallet)
    if (xWalletReq) {
      bundle.meta.xWallet = xWalletReq.meta.xWallet
    }
  }

  return bundle
}

export function addMockedTxnToBundle(bundle, selectedNetwork, selectedAcc) {
  const tempBundle = bundle
  const mockTxn = {
    to: accountPresets.feeCollector,
    value: ethers.utils.parseUnits('0.0006969696', 18).toHexString(),
    data: '0x'
  }
  
  const req = {
    id: `transfer_${Date.now()}`,
    type: 'eth_sendTransaction',
    chainId: selectedNetwork.chainId,
    account: selectedAcc,
    txn: mockTxn,
    meta: null
}
  tempBundle.txns = [...tempBundle.txns, toBundleTxn(req, selectedAcc)]
  tempBundle.extraGas += req.extraGas

  return tempBundle
}