import { useState } from "react";
import cn from "classnames";

import { Checkbox, Panel } from "components/common";
import Options from "./Options/Options";
import Replace from "./Replace/Replace";
import ActionsWrapper from "./ActionsWrapper/ActionsWrapper";
import { onTxnRejected } from "components/SDK/WindowMessages";

import styles from './DetailsPanel.module.scss'

const DetailsPanel = ({
  estimation,
  setEstimation,
  network,
  bundle,
  relayerURL,
  feeSpeed,
  setFeeSpeed,
  account,
  signingStatus,
  isInt,
  setSigningStatus,
  resolveMany,
  onDismiss,
  mustReplaceNonce,
  replaceByDefault,
  isMounted,
  currentAccGasTankState,
  REJECT_MSG,
  onBroadcastedTxn,
  panelClassName,
  panelTitleClassName
}) => {
  const [replaceTx, setReplaceTx] = useState(!!replaceByDefault);

  // The final bundle is used when signing + sending it
  // the bundle before that is used for estimating

  const rejectTxn = () => {
    onDismiss();
    bundle.requestIds &&
      resolveMany(bundle.requestIds, { message: REJECT_MSG });
    onTxnRejected()
  };

  // `mustReplaceNonce` is set on speedup/cancel, to prevent the user from broadcasting the txn if the same nonce has been mined
  const canProceed = isInt(mustReplaceNonce)
    ? isInt(estimation?.nextNonce?.nextNonMinedNonce)
      ? mustReplaceNonce >= estimation?.nextNonce?.nextNonMinedNonce
      : null // null = waiting to get nonce data from relayer
    : true;

  return (
    <Panel className={cn(panelClassName)}>
      <div className={styles.panelBody}>
        <h2 className={cn(panelTitleClassName, styles.title)}>Estimation</h2>
        <Options
          account={account}
          network={network}
          estimation={estimation}
          signingStatus={signingStatus}
          feeSpeed={feeSpeed}
          setFeeSpeed={setFeeSpeed}
          setEstimation={setEstimation}
          onDismiss={onDismiss}
          relayerURL={relayerURL}
          bundle={bundle}
          canProceed={canProceed}
          currentAccGasTankState={currentAccGasTankState}
        />
        <Replace
          isInt={isInt}
          mustReplaceNonce={mustReplaceNonce}
          canProceed={canProceed}
          rejectTxn={rejectTxn}
        />

        {
          // If there's `bundle.nonce` set, it means we're cancelling or speeding up, so this shouldn't even be visible
          // We also don't show this in any case in which we're forced to replace a particular transaction (mustReplaceNonce)
          !isInt(bundle.nonce) &&
            !isInt(mustReplaceNonce) &&
            !!estimation?.nextNonce?.pendingBundle && (
              <div>
                <Checkbox
                  label="Replace currently pending transaction"
                  checked={replaceTx}
                  onChange={({ target }) => setReplaceTx(target.checked)}
                />
              </div>
            )
        }
      </div>

      <ActionsWrapper
        signingStatus={signingStatus}
        setSigningStatus={setSigningStatus}
        account={account}
        bundle={bundle}
        isMounted={isMounted}
        onDismiss={onDismiss}
        network={network}
        relayerURL={relayerURL}
        estimation={estimation}
        feeSpeed={feeSpeed}
        isInt={isInt}
        replaceTx={replaceTx}
        rejectTxn={rejectTxn}
        currentAccGasTankState={currentAccGasTankState}
        onBroadcastedTxn={onBroadcastedTxn}
        resolveMany={resolveMany}
        canProceed={canProceed}
      />
    </Panel>
  );
};

export default DetailsPanel;
