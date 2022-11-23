import cn from 'classnames'

import styles from './EstimatedGasFees.module.scss'

const EstimatedGasFees = ({ estimatedGasFees, selectedGasSpeed, setSelectedGasSpeed }) => {
  return estimatedGasFees ? (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>Estimated gas fee</h3>
      <div className={styles.fees}>
        {Object.values(estimatedGasFees.gasFees).map((f, index) => {
          return (
            <div
              className={cn(styles.fee, { [styles.selected]: f.speed === selectedGasSpeed })}
              key={index}
              onClick={() => setSelectedGasSpeed(f.speed)}
            >
              <p className={styles.feeName}>{f.speed}</p>
            </div>
          )
        })}
      </div>
      <div className={styles.details}>
        <p className={styles.detailsLabel}>
          Signer fee
          {(!!estimatedGasFees.nativeTransfersCount || !!estimatedGasFees.regularTransfersCount) && (
            <span className={styles.actions}>
              (<span>{estimatedGasFees.nativeTransfersCount + estimatedGasFees.regularTransfersCount} transfers</span>)
            </span>
          )}
        </p>
        <p className={styles.detailsAmount}>
          ${estimatedGasFees.gasFees[selectedGasSpeed].signerTransactionsCostUSD.toFixed(2)}
        </p>
      </div>
    </div>
  ) : null
}

export default EstimatedGasFees
