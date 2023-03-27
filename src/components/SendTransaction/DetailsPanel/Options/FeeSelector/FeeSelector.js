import { ethers } from 'ethers'

import {
  isTokenEligible,
  mapTxnErrMsg,
  getErrHint,
  getFeesData,
  getDiscountApplied,
  checkIfDAppIncompatible
} from 'components/SendTransaction/helpers'
import { Loading, DAppIncompatibilityWarningMsg, Alert } from 'components/common'
// Sections
import FailingTxn from 'components/SendTransaction/DetailsPanel/FailingTxn/FailingTxn'
import { getTokenIcon } from 'lib/icons'
import { FaPercentage } from 'react-icons/fa'
import WalletDiscountBanner from './WalletDiscountBanner/WalletDiscountBanner'
import FeeCurrencySelect from './FeeCurrencySelect/FeeCurrencySelect'
import FeesBreakdown from './FeesBreakdown/FeesBreakdown'
import SelectFeeType from './SelectFeeType/SelectFeeType'

import styles from './FeeSelector.module.scss'

const SPEEDS = ['slow', 'medium', 'fast', 'ape']
const walletDiscountBlogpost =
  'https://blog.ambire.com/move-crypto-with-ambire-pay-gas-with-wallet-and-save-30-on-fees-35dca1002697'
// NOTE: Order matters for for secondary fort after the one by discount
const DISCOUNT_TOKENS_SYMBOLS = ['xWALLET', 'WALLET-STAKING', 'WALLET']

const mapGasTankTokens = (nativePrice) => (item) => {
  const nativeRate =
    item.address === '0x0000000000000000000000000000000000000000' ? null : nativePrice / item.price
  return {
    ...item,
    symbol: item.symbol.toUpperCase(),
    balance: ethers.utils
      .parseUnits(item.balance.toFixed(item.decimals).toString(), item.decimals)
      .toString(),
    nativeRate
  }
}

export function FeeSelector({
  disabled,
  signer,
  estimation,
  network,
  setEstimation,
  feeSpeed,
  setFeeSpeed,
  onDismiss,
  isGasTankEnabled
}) {
  if (!estimation) return <Loading />
  // Only check for insufficient fee in relayer mode (.feeInUSD is available)
  // Otherwise we don't care whether the user has enough for fees, their signer wallet will take care of it
  const insufficientFee =
    estimation &&
    estimation.feeInUSD &&
    !isTokenEligible(estimation.selectedFeeToken, feeSpeed, estimation, isGasTankEnabled, network)
  if (estimation && !estimation.success)
    return !checkIfDAppIncompatible(estimation.message) ? (
      <FailingTxn
        message={`The current transaction batch cannot be sent because it will fail: ${mapTxnErrMsg(
          estimation.message
        )}`}
        tooltip={getErrHint(estimation.message)}
      />
    ) : (
      <DAppIncompatibilityWarningMsg
        title="Unable to send transaction"
        msg={getErrHint(estimation.message)}
      />
    )

  if (!estimation.feeInNative) return null
  if (estimation && !estimation.feeInUSD && estimation.gasLimit < 40000) {
    return (
      <div>
        <b>WARNING:</b> Fee estimation unavailable when you're doing your first account transaction
        and you are not connected to a relayer. You will pay the fee from <b>{signer.address}</b>,
        make sure you have {network.nativeAssetSymbol} there.
      </div>
    )
  }
  if (estimation && estimation.feeInUSD && !estimation.remainingFeeTokenBalances) {
    return (
      <div className="balance-error">
        Internal error: fee balances not available. This should never happen, please report this on
        help.ambire.com
      </div>
    )
  }

  const { nativeAssetSymbol } = network
  const gasTankTokens = estimation.gasTank?.map(mapGasTankTokens(estimation.nativeAssetPriceInUSD))
  const tokens =
    isGasTankEnabled && gasTankTokens?.length
      ? gasTankTokens
      : // fallback to the native asset if fee tokens cannot be retrieved for wh  atever reason
        estimation.remainingFeeTokenBalances || [
          {
            symbol: nativeAssetSymbol,
            decimals: 18,
            address: '0x0000000000000000000000000000000000000000'
          }
        ]

  const onFeeCurrencyChange = ({ value, label }) => {
    const token = tokens.find(({ address, symbol }) => address === value && symbol === label)
    setEstimation({ ...estimation, selectedFeeToken: token })
  }

  const currenciesItems = tokens
    // NOTE: filter by slowest and then will disable the higher fees speeds otherwise
    // it will just hide the token from the select
    .sort(
      (a, b) =>
        isTokenEligible(b, SPEEDS[0], estimation, isGasTankEnabled, network) -
          isTokenEligible(a, SPEEDS[0], estimation, isGasTankEnabled, network) ||
        DISCOUNT_TOKENS_SYMBOLS.indexOf(b.symbol) - DISCOUNT_TOKENS_SYMBOLS.indexOf(a.symbol) ||
        (b.discount || 0) - (a.discount || 0) ||
        a?.symbol.toUpperCase().localeCompare(b?.symbol.toUpperCase())
    )
    .map(({ address, symbol, discount, network: tokenNetwork, icon, ...rest }) => ({
      disabled: !isTokenEligible(
        { address, symbol, discount, ...rest },
        SPEEDS[0],
        estimation,
        isGasTankEnabled,
        network
      ),
      icon:
        icon ||
        (address ? getTokenIcon(isGasTankEnabled ? tokenNetwork : network.id, address) : null),
      label: symbol,
      value: address || symbol,
      ...(discount
        ? {
            extra: (
              <div className="discount">
                {' '}
                - {discount * 100} <FaPercentage />{' '}
              </div>
            )
          }
        : {})
    }))

  const { discount = 0, symbol, nativeRate = null, decimals } = estimation.selectedFeeToken || {}

  if (insufficientFee) {
    const sufficientSpeeds = SPEEDS.filter((speed, i) =>
      isTokenEligible(estimation.selectedFeeToken, speed, estimation, isGasTankEnabled, network)
    )
    const highestSufficientSpeed = sufficientSpeeds[sufficientSpeeds.length - 1]
    setFeeSpeed(highestSufficientSpeed)
  }

  const { feeInFeeToken, feeInUSD, savedGas } = getFeesData(
    estimation.selectedFeeToken,
    estimation,
    feeSpeed,
    isGasTankEnabled,
    network
  )

  const discountInFeeToken = getDiscountApplied(feeInFeeToken, discount)

  // Fees with no discounts applied
  const baseFeeInFeeToken = feeInFeeToken + discountInFeeToken
  // Removed 'xWallet' from accepted tokens list in case if someone still has it in its Gas Tank
  const filteredRemFeeTokens = (estimation.remainingFeeTokenBalances || [])
    .map((x) => x.symbol)
    .filter((x) => x !== 'XWALLET')
    .join(', ')

  return (
    <>
      {insufficientFee ? (
        <Alert
          className={styles.alert}
          type="danger"
          size="small"
          title="Insufficient balance for the fee."
          text={`Accepted tokens: ${filteredRemFeeTokens}.
          ${isGasTankEnabled ? 'Disable your Gas Tank to use the default fee tokens.' : ''}
        `}
          iconNextToTitle
        />
      ) : (
        <FeeCurrencySelect
          estimation={estimation}
          disabled={disabled}
          currenciesItems={currenciesItems}
          onFeeCurrencyChange={onFeeCurrencyChange}
        />
      )}

      <WalletDiscountBanner
        selectedFeeToken={estimation.selectedFeeToken}
        currenciesItems={currenciesItems}
        tokens={tokens}
        estimation={estimation}
        onFeeCurrencyChange={onFeeCurrencyChange}
        onDismiss={onDismiss}
        feeSpeed={feeSpeed}
        isGasTankEnabled={isGasTankEnabled}
        network={network}
        DISCOUNT_TOKENS_SYMBOLS={DISCOUNT_TOKENS_SYMBOLS}
        walletDiscountBlogpost={walletDiscountBlogpost}
      />

      <div className={styles.title}>
        <span>Transaction Speed</span>
        {network.isGasTankAvailable && (
          <span>
            Gas Tank:{' '}
            {isGasTankEnabled ? (
              <span className={styles.gasTankEnabled}>Enabled</span>
            ) : (
              <span className={styles.gasTankDisabled}>Disabled</span>
            )}
          </span>
        )}
      </div>

      <SelectFeeType
        estimation={estimation}
        setEstimation={setEstimation}
        isGasTankEnabled={isGasTankEnabled}
        network={network}
        discount={discount}
        baseFeeInFeeToken={baseFeeInFeeToken}
        getDiscountApplied={getDiscountApplied}
        SPEEDS={SPEEDS}
        symbol={symbol}
        nativeRate={nativeRate}
        disabled={disabled}
        decimals={decimals}
        feeSpeed={feeSpeed}
        setFeeSpeed={setFeeSpeed}
        nativeAssetSymbol={nativeAssetSymbol}
      />

      <FeesBreakdown
        discount={discount}
        estimation={estimation}
        feeInUSD={feeInUSD}
        baseFeeInFeeToken={baseFeeInFeeToken}
        savedGas={savedGas}
        isGasTankEnabled={isGasTankEnabled}
        decimals={decimals}
        walletDiscountBlogpost={walletDiscountBlogpost}
        DISCOUNT_TOKENS_SYMBOLS={DISCOUNT_TOKENS_SYMBOLS}
      />

      {!estimation.feeInUSD ? (
        <Alert
          className={styles.alert}
          type="warning"
          title="Warning"
          text={`
          Paying fees in tokens other than ${nativeAssetSymbol} is unavailable because you are not connected to a relayer.
          You will pay the fee from ${signer.address}
        `}
          iconNextToTitle
        />
      ) : null}
    </>
  )
}
