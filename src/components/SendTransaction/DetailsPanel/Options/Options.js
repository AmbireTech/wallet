import * as blockies from 'blockies-ts'

import { FeeSelector } from 'components/SendTransaction/DetailsPanel/Options/FeeSelector/FeeSelector'
import AccountAndNetwork from './AccountAndNetwork/AccountAndNetwork'

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
  const accountAvatar = blockies.create({ seed: account.id }).toDataURL()

  return (
    <div className={styles.wrapper}>
      <AccountAndNetwork account={account} accountAvatar={accountAvatar} network={network} />
      {/* Only lock the fee selector when the bundle is locked too - to make sure that the fee really is set in stone (won't change on the next getFinalBundle()) */}
      {canProceed && (
        <FeeSelector
          disabled={
            signingStatus && signingStatus.finalBundle && !(estimation && !estimation.success)
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
