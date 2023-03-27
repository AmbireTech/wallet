import { useState } from 'react'
import cn from 'classnames'

import { formatFloatTokenAmount } from 'lib/formatters'

import { getFeesData } from 'components/SendTransaction/helpers'
import { Button, TextInput } from 'components/common'
import { ReactComponent as EditIcon } from 'resources/icons/edit.svg'
import FeeAmountSelectors from './FeeAmountSelectors/FeeAmountSelectors'

import styles from './SelectFeeType.module.scss'

const OVERPRICED_MULTIPLIER = 1.2

const SelectFeeType = ({
  estimation,
  setEstimation,
  isGasTankEnabled,
  network,
  discount,
  baseFeeInFeeToken,
  getDiscountApplied,
  SPEEDS,
  symbol,
  nativeRate,
  disabled,
  decimals,
  feeSpeed,
  setFeeSpeed,
  nativeAssetSymbol
}) => {
  const [editCustomFee, setEditCustomFee] = useState(false)

  const setCustomFee = (value) =>
    setEstimation((prevEstimation) => ({
      ...prevEstimation,
      customFee: value
    }))

  const { feeInFeeToken: minFee, feeInUSD: minFeeUSD } = getFeesData(
    { ...estimation.selectedFeeToken },
    { ...estimation, customFee: null },
    'slow',
    isGasTankEnabled,
    network
  )

  const { feeInFeeToken: maxFee, feeInUSD: maxFeeUSD } = getFeesData(
    { ...estimation.selectedFeeToken },
    { ...estimation, customFee: null },
    'ape',
    isGasTankEnabled,
    network
  )

  const discountMin = getDiscountApplied(minFee, discount)
  const discountMax = getDiscountApplied(maxFee, discount)

  const discountBaseMinInUSD = getDiscountApplied(minFeeUSD, discount)
  const discountBaseMaxInUSD = getDiscountApplied(maxFeeUSD, discount)

  // Fees with no discounts applied
  const baseMinFee = minFee + discountMin
  const baseMaxFee = (maxFee + discountMax) * OVERPRICED_MULTIPLIER
  const baseMinFeeUSD = minFeeUSD + discountBaseMinInUSD
  const baseMaxFeeUSD = (maxFeeUSD + discountBaseMaxInUSD) * OVERPRICED_MULTIPLIER

  const isUnderpriced =
    !!estimation.customFee &&
    !isNaN(parseFloat(estimation.customFee)) &&
    baseFeeInFeeToken < baseMinFee

  const isOverpriced =
    !!estimation.customFee &&
    !isNaN(parseFloat(estimation.customFee)) &&
    baseFeeInFeeToken > baseMaxFee

  return (
    <div className={styles.wrapper}>
      <FeeAmountSelectors
        setFeeSpeed={setFeeSpeed}
        setCustomFee={setCustomFee}
        setEditCustomFee={setEditCustomFee}
        disabled={disabled}
        estimation={estimation}
        isGasTankEnabled={isGasTankEnabled}
        network={network}
        discount={discount}
        symbol={symbol}
        SPEEDS={SPEEDS}
        nativeAssetSymbol={nativeAssetSymbol}
        feeSpeed={feeSpeed}
        decimals={decimals}
        nativeRate={nativeRate}
      />
      {!editCustomFee ? (
        <div className={styles.editCustomFee} onClick={() => setEditCustomFee(true)}>
          <EditIcon />
          Edit fee
        </div>
      ) : (
        <div className={styles.customFeeSelector}>
          <h2 className={styles.title}>Custom Fee ({symbol})</h2>
          <TextInput
            placeholder="Enter amount"
            className={cn({ [styles.inputMb]: isOverpriced || isUnderpriced })}
            onChange={(value) => setCustomFee(value)}
            value={estimation.customFee}
          />
          {isUnderpriced && (
            <div className={styles.priceWarning}>
              <div>
                Custom Fee too low. You can try to "sign and send" the transaction but most probably
                it will fail.
              </div>
              <div>
                Min estimated fee: &nbsp;
                <Button textOnly onClick={() => setCustomFee(baseMinFee)}>
                  {baseMinFee} {symbol}
                </Button>
                {!isNaN(baseMinFeeUSD) && (
                  <span>&nbsp; (~${formatFloatTokenAmount(baseMinFeeUSD, true, 4)}) </span>
                )}
              </div>
            </div>
          )}
          {isOverpriced && (
            <div className={styles.priceWarning}>
              <div>
                Custom Fee is higher than the APE speed. You will pay more than probably needed.
                Make sure you know what are you doing!
              </div>
              <div>
                Recommended max fee: &nbsp;
                <Button textOnly onClick={() => setCustomFee(baseMaxFee)}>
                  {baseMaxFee} {symbol}
                </Button>
                {!isNaN(baseMaxFeeUSD) && (
                  <span>&nbsp; (~${formatFloatTokenAmount(baseMaxFeeUSD, true, 4)}) </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SelectFeeType
