import cn from 'classnames'
import { MdInfo } from "react-icons/md"
import FailingTxn from "components/SendTransaction/DetailsPanel/FailingTxn/FailingTxn";
import Actions from "./Actions/Actions";

import styles from './ActionsWrapper.module.scss';

const ActionsWrapper = ({
  signingStatus,
  setSigningStatus,
  account,
  bundle,
  isMounted,
  onDismiss,
  network,
  relayerURL,
  estimation,
  feeSpeed,
  isInt,
  replaceTx,
  rejectTxn,
  currentAccGasTankState,
  onBroadcastedTxn,
  resolveMany,
  canProceed
}) => {

  return canProceed && (
    <>
      {estimation &&
      estimation.success &&
      estimation.isDeployed === false &&
      bundle.gasLimit ? (
        <div className={styles.firstTxNote}>
          <div className={styles.firstTxNoteTitle}>
            <MdInfo />
            Note
          </div>
          <div className={styles.firstTxNoteMessage}>
            Because this is your first Ambire transaction, this fee is{" "}
            {((60000 / bundle.gasLimit) * 100).toFixed()}% higher than usual
            because we have to deploy your smart wallet. Subsequent
            transactions will be cheaper
          </div>
        </div>
      ) : null}

      <div className={styles.actionsWrapper}>
        {bundle.signer.quickAccManager && !relayerURL ? (
          <FailingTxn message="Signing transactions with an email/password account without being connected to the relayer is unsupported." />
        ) : (
          <div className={cn(styles.section, styles.actions)}>
            <Actions
              estimation={estimation}
              rejectTxn={rejectTxn}
              cancelSigning={() => setSigningStatus(null)}
              signingStatus={signingStatus}
              setSigningStatus={setSigningStatus}
              feeSpeed={feeSpeed}
              isGasTankEnabled={
                currentAccGasTankState.isEnabled && !!relayerURL
              }
              network={network}
              account={account}
              bundle={bundle}
              isMounted={isMounted}
              onDismiss={onDismiss}
              relayerURL={relayerURL}
              isInt={isInt}
              replaceTx={replaceTx}
              currentAccGasTankState={currentAccGasTankState}
              onBroadcastedTxn={onBroadcastedTxn}
              resolveMany={resolveMany}
            />
          </div>
        )}
      </div>
    </>
  )
}

export default ActionsWrapper