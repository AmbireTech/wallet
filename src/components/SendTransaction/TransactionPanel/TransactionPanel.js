import cn from "classnames";

import { Panel, Alert } from "components/common";
import TxnPreview from "components/common/TxnPreview/TxnPreview";
import { useSDKContext } from "components/SDKProvider/SDKProvider";

import styles from "./TransactionPanel.module.scss";

const TransactionPanel = ({
  bundle,
  estimation,
  REJECT_MSG,
  resolveMany,
  signingStatus,
  panelClassName,
  panelTitleClassName,
}) => {
  const { isSDK } = useSDKContext()

  return (
    <Panel className={cn(panelClassName, styles.wrapper)}>
      <div className={styles.panelBody}>
        <h2 className={cn(panelTitleClassName, styles.title)}>{ bundle.txns.length } Transaction{ bundle.txns.length > 1 ? 's' : '' } Waiting</h2>
        <div
          className={cn(styles.listOfTransactions, {
            [styles.frozen]: !bundle.requestIds,
            [styles.sdk]: isSDK
          })}
        >
          {bundle.txns.map((txn, i) => {
            const isFirstFailing =
              estimation &&
              !estimation.success &&
              estimation.firstFailing === i;
            // we need to re-render twice per minute cause of DEX deadlines
            const min = Math.floor(Date.now() / 30000);
            return (
              <TxnPreview
                key={[...txn, i].join(":")}
                // pasing an unused property to make it update
                minute={min}
                onDismiss={
                  bundle.requestIds &&
                  (() =>
                    resolveMany([bundle.requestIds[i]], {
                      message: REJECT_MSG,
                    }))
                }
                txn={txn}
                network={bundle.network}
                account={bundle.identity}
                isFirstFailing={isFirstFailing}
                disableDismiss={!!signingStatus}
                disableDismissLabel={
                  "Cannot modify transaction bundle while a signing procedure is pending"
                }
                addressLabel={!!bundle.meta && bundle.meta.addressLabel}
              />
            );
          })}
        </div>
      </div>
      {!isSDK && bundle.requestIds && <Alert
        title="Degen tip"
        type="degenTip"
        text="
          You can sign multiple transactions at once. Add more
          transactions to this batch by interacting with a connected
          dApp right now. Alternatively, you may click 'Back' to add
          more transactions.
        "
        iconNextToTitle={true}
      />}
    </Panel>
  );
};

export default TransactionPanel;
