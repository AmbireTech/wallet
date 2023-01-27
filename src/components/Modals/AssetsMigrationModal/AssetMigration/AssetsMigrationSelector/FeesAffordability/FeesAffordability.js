import { useCallback } from 'react'
import BigNumber from 'bignumber.js'

import styles from './FeesAffordability.module.scss'

const FeesAffordability = ({
  canCoverGasFees,
  onAssetAmountChange,
  nativeToken,
  estimatedGasFees,
  selectedGasSpeed,
  selectableTokensUserInputs,
  network,
}) => {
  const getMaxTransferableNative = useCallback(
    (speed) => {
      return new BigNumber(nativeToken?.availableBalance).minus(estimatedGasFees.gasFees[speed].signerTransactionsCost)
    },
    [estimatedGasFees, nativeToken]
  )

  // @TODO Add Alert component
  return !canCoverGasFees(selectedGasSpeed) && selectableTokensUserInputs.filter((a) => a.selected).length > 0 ? (
    <div className={'notification-hollow warning mt-3 mb-3'}>
      Your Signer Wallet will not have enough fees to pay for the migration. Please transfer a maximum of{' '}
      <span
        className={styles.maxNativeSuggestion}
        onClick={() =>
          onAssetAmountChange(
            new BigNumber(getMaxTransferableNative(selectedGasSpeed))
              .dividedBy(10 ** nativeToken?.decimals)
              .toFixed(6, BigNumber.ROUND_DOWN),
            nativeToken
          )
        }
      >
        {new BigNumber(getMaxTransferableNative(selectedGasSpeed))
          .dividedBy(10 ** nativeToken?.decimals)
          .toFixed(6, BigNumber.ROUND_DOWN)}{' '}
        {network.nativeAssetSymbol}
      </span>
    </div>
  ) : null
}

export default FeesAffordability
