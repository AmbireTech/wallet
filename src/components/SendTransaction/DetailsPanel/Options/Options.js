import * as blockies from 'blockies-ts'

import { networkIconsById } from 'consts/networks'
import { FeeSelector } from 'components/SendTransaction/DetailsPanel/Options/FeeSelector/FeeSelector'

import styles from './Options.module.scss'

const Options = ({
  account,
  network,
  estimation,
  signingStatus,
  feeSpeed,
  setFeeSpeed,
  setEstimation,
  onDismiss,
  relayerURL,
  bundle,
  canProceed,
  currentAccGasTankState
}) => {
  const accountAvatar = blockies.create({ seed: account.id }).toDataURL();

  return (
    <div className={styles.wrapper}>
      <div className={styles.details}>
        <h2 className={styles.detailsTitle}>Signing With</h2>
        <div className={styles.accountAndNetwork}>
          <div className={styles.account}>
            <img
              className={styles.avatar}
              alt="avatar"
              src={accountAvatar}
            />
            <p className={styles.address}>{account.id}</p>
          </div>
          <p className={styles.network}>
            on {network.name}
            <img
              className={styles.icon}
              src={networkIconsById[network.id]}
              alt={network.name}
            />
          </p>
        </div>
      </div>

      {/* Only lock the fee selector when the bundle is locked too - to make sure that the fee really is set in stone (won't change on the next getFinalBundle()) */}
      {canProceed && (
        <FeeSelector
          disabled={
            signingStatus &&
            signingStatus.finalBundle &&
            !(estimation && !estimation.success)
          }
          signer={bundle.signer}
          estimation={estimation}
          setEstimation={setEstimation}
          network={network}
          feeSpeed={feeSpeed}
          setFeeSpeed={setFeeSpeed}
          onDismiss={onDismiss}
          isGasTankEnabled={currentAccGasTankState.isEnabled && !!relayerURL}
        />
      )}
    </div>
  )
}

export default Options