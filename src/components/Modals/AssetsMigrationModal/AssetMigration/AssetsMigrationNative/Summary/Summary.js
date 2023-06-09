import { useCallback, useEffect, useState } from 'react'
import BigNumber from 'bignumber.js'

import { fetchGet } from 'lib/fetch'

import { TextInput } from 'components/common'

import styles from './Summary.module.scss'

const Summary = ({
  network,
  relayerURL,
  gasSpeed,
  nativeTokenData,
  nativeAmount,
  setNativeAmount,
  selectedTokensWithAllowance,
  setCurrentGasPrice,
  isMigrationPending,
  hasERC20Tokens,
  setError
}) => {
  const [maxRecommendedAmount, setMaxRecommendedAmount] = useState(null)
  const [transactionEstimationCost, setTransactionEstimationCost] = useState('0')
  const [nativeHumanAmount, setNativeHumanAmount] = useState('0')

  const [hasModifiedAmount, setHasModifiedAmount] = useState(false)

  const erc20TransfersCount = (selectedTokensWithAllowance) => {
    return selectedTokensWithAllowance.filter((t) => t.selected && !t.permittable && !t.native)
      .length
  }

  const updateAmount = useCallback(
    (amount) => {
      const newHumanAmount = new BigNumber(amount)
        .dividedBy(10 ** nativeTokenData.decimals)
        .toFixed(nativeTokenData.decimals)
        .replace(/\.?0+$/g, '')

      setNativeHumanAmount(newHumanAmount)
      setNativeAmount(amount)
      setHasModifiedAmount(true)
    },
    [nativeTokenData, setNativeAmount]
  )

  useEffect(() => {
    const url = `${relayerURL}/gasPrice/${network.id}`

    fetchGet(url)
      .then((gasData) => {
        let gasPrice = gasData.data.gasPrice[gasSpeed]
        if (gasData.data.gasPrice.maxPriorityFeePerGas) {
          gasPrice += gasData.data.gasPrice.maxPriorityFeePerGas[gasSpeed]
        }
        const nativeTransactionCost = gasPrice * 25000

        const regularTransfersCount = erc20TransfersCount(selectedTokensWithAllowance)
        const transfersTransactionCost = regularTransfersCount * gasPrice * (25000 + 52000)

        setTransactionEstimationCost(
          new BigNumber((nativeTransactionCost + transfersTransactionCost).toFixed(0)).toFixed(0)
        )
        const recommendedBN = new BigNumber(nativeTokenData.availableBalance).minus(
          nativeTransactionCost + transfersTransactionCost
        )
        setMaxRecommendedAmount(recommendedBN.gte(0) ? recommendedBN.toFixed(0) : 0)
        setCurrentGasPrice(gasPrice)
      })
      .catch((err) => {
        setError(`${err.message} ${url}`)
      })
  }, [
    setTransactionEstimationCost,
    setMaxRecommendedAmount,
    nativeTokenData,
    network,
    relayerURL,
    setError,
    gasSpeed,
    selectedTokensWithAllowance,
    setCurrentGasPrice
  ])
  const onAmountChange = useCallback(
    (val) => {
      setHasModifiedAmount(true)
      if (val === '') {
        setNativeHumanAmount(0)
        setNativeAmount(0)
        return
      }
      if (
        (val.endsWith('.') && val.split('.').length === 2) ||
        (val.split('.').length === 2 && val.endsWith('0'))
      ) {
        setNativeHumanAmount(val)
        return
      }

      if (!isNaN(val)) {
        let newHumanAmount = new BigNumber(val).toFixed(nativeTokenData.decimals)
        if (
          new BigNumber(newHumanAmount)
            .multipliedBy(10 ** nativeTokenData.decimals)
            .comparedTo(nativeTokenData.availableBalance) === 1
        ) {
          newHumanAmount = new BigNumber(nativeTokenData.availableBalance)
            .dividedBy(10 ** nativeTokenData.decimals)
            .toFixed(nativeTokenData.decimals)
        }
        // trim trailing . or 0
        newHumanAmount = newHumanAmount.replace(/\.?0+$/g, '')

        setNativeHumanAmount(newHumanAmount)
        setNativeAmount(
          new BigNumber(newHumanAmount).multipliedBy(10 ** nativeTokenData.decimals).toFixed(0)
        )
      }
    },
    [nativeTokenData, setNativeAmount]
  )

  useEffect(() => {
    const initialHumanAmount = new BigNumber(nativeTokenData.amount)
      .dividedBy(10 ** nativeTokenData.decimals)
      .toFixed(nativeTokenData.decimals)
      .replace(/\.?0+$/g, '')
    setNativeHumanAmount(initialHumanAmount)
    setNativeAmount(nativeTokenData.amount)
  }, [nativeTokenData, setNativeAmount])

  return (
    <div className={styles.wrapper}>
      <div className={styles.item}>
        <span className={styles.itemTitle}>Current balance</span>
        <span
          className={styles.selection}
          onClick={() => updateAmount(nativeTokenData.availableBalance)}
        >
          {new BigNumber(nativeTokenData.availableBalance)
            .dividedBy(10 ** nativeTokenData.decimals)
            .toFixed(6)}{' '}
          {nativeTokenData.name}
        </span>
      </div>

      <div className={styles.item}>
        <span className={styles.itemTitle}>Amount to migrate</span>
        {hasModifiedAmount ||
        (maxRecommendedAmount !== null && nativeAmount > maxRecommendedAmount) ? (
          <TextInput
            small
            className={styles.amountInput}
            value={nativeHumanAmount}
            onChange={onAmountChange}
          />
        ) : (
          <div>{nativeHumanAmount}</div>
        )}
      </div>
      {/* @TODO Implement Alert component */}
      {maxRecommendedAmount !== null && new BigNumber(nativeAmount).gt(maxRecommendedAmount) && (
        <div className="notification-hollow warning mt-4">
          <div>
            {erc20TransfersCount(selectedTokensWithAllowance)
              ? 'Signer transactions cost'
              : 'Current Transaction cost'}
            : ~
            {new BigNumber(transactionEstimationCost)
              .dividedBy(10 ** nativeTokenData.decimals)
              .toFixed(6)}{' '}
            {nativeTokenData.name}
            <span className={styles.usd}>
              {' '}
              ($
              {new BigNumber(transactionEstimationCost)
                .multipliedBy(nativeTokenData.rate)
                .toFixed(2)}
              )
            </span>
          </div>

          <div className={styles.message}>
            {maxRecommendedAmount > 0 ? (
              <>
                <span>You should migrate up to </span>
                <span
                  className={styles.selection}
                  onClick={() => updateAmount(maxRecommendedAmount)}
                >
                  {new BigNumber(maxRecommendedAmount)
                    .dividedBy(10 ** nativeTokenData.decimals)
                    .toFixed(6)}{' '}
                  {nativeTokenData.name}
                </span>
                <span> because will you need funds to pay the transaction costs.</span>
              </>
            ) : (
              <span>You do not have enough funds to pay the transaction fee.</span>
            )}
          </div>
        </div>
      )}

      {/* @TODO Implement Alert component */}
      {isMigrationPending && hasERC20Tokens && (
        <div className="notification-hollow info mt-4">
          Waiting for the transaction to be mined before continuing migration...
        </div>
      )}
      {isMigrationPending && !hasERC20Tokens && (
        <div className="notification-hollow info mt-4">
          The amount of {nativeTokenData.name} will be updated in your wallet, once the transaction
          has been confirmed and mined. If you confirmed your transaction, you can already close
          this window
        </div>
      )}
    </div>
  )
}

export default Summary
