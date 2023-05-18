import cn from 'classnames'

import { formatFloatTokenAmount } from 'lib/formatters'

import {
  isTokenEligible,
  getFeesData,
  getDiscountApplied
} from 'components/SendTransaction/helpers'

import { FaPercentage } from 'react-icons/fa'

import styles from './FeeAmountSelectors.module.scss'

const FeeAmountSelectors = ({
  setFeeSpeed,
  setCustomFee,
  setEditCustomFee,
  disabled,
  estimation,
  isGasTankEnabled,
  network,
  discount,
  symbol,
  SPEEDS,
  nativeAssetSymbol,
  feeSpeed,
  decimals,
  nativeRate
}) => {
  const selectFeeSpeed = (speed) => {
    setFeeSpeed(speed)
    setCustomFee(null)
    setEditCustomFee(false)
  }

  const checkIsSelectorDisabled = (speed) => {
    const insufficientFee = !isTokenEligible(
      estimation.selectedFeeToken,
      speed,
      estimation,
      isGasTankEnabled,
      network
    )
    return disabled || insufficientFee
  }

  return (
    <div className={styles.wrapper}>
      {SPEEDS.map((speed) => {
        const isETH = symbol === 'ETH' && nativeAssetSymbol === 'ETH'
        const {
          feeInFeeToken,
          feeInUSD
          // NOTE: get the estimation res data w/o custom fee for the speeds
        } = getFeesData(
          { ...estimation.selectedFeeToken },
          { ...estimation, customFee: null },
          speed,
          isGasTankEnabled,
          network
        )
        const discountInFeeToken = getDiscountApplied(feeInFeeToken, discount)
        const discountInFeeInUSD = getDiscountApplied(feeInUSD, discount)

        const baseFeeInFeeToken = feeInFeeToken + discountInFeeToken
        const baseFeeInFeeUSD = feeInUSD ? feeInUSD + discountInFeeInUSD : null

        const showInUSD = nativeRate !== null && baseFeeInFeeUSD

        return (
          <div
            key={speed}
            className={cn(styles.feeSquare, {
              [styles.selected]: !estimation.customFee && feeSpeed === speed,
              [styles.disabled]: checkIsSelectorDisabled(speed)
            })}
            onClick={() => !checkIsSelectorDisabled(speed) && selectFeeSpeed(speed)}
          >
            {!!discount && <FaPercentage className={styles.discountBadge} />}
            <h4 className={styles.speed}>{speed}</h4>
            <p className={styles.feeEstimation}>
              {(isETH ? 'Ξ ' : '') +
                (showInUSD
                  ? `$${formatFloatTokenAmount(baseFeeInFeeUSD, true, 4)}`
                  : formatFloatTokenAmount(baseFeeInFeeToken, true, decimals))}
            </p>
            {!isETH && !showInUSD && (
              <p className={cn(styles.feeEstimation, styles.symbol)}>
                {estimation.selectedFeeToken.symbol}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default FeeAmountSelectors
