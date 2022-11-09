import cn from "classnames";
import { GiGorilla } from "react-icons/gi";
import TxnPreview from "components/common/TxnPreview/TxnPreview";
import { Panel } from "components/common";

import styles from "./TransactionPanel.module.scss";

const TransactionPanel = ({
  bundle,
  estimation,
  REJECT_MSG,
  resolveMany,
  signingStatus,
  panelClassName
}) => {
  return (
    <Panel className={cn(panelClassName, styles.wrapper)}>
      <div
        className={cn(styles.listOfTransactions, {
          [styles.frozen]: !bundle.requestIds,
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

      <div className={styles.transactionsNote}>
        {
          // only render this if we're using the queue
          bundle.requestIds && (
            <>
              <b>
                <GiGorilla size={16} /> DEGEN TIP
              </b>
              <span>
                You can sign multiple transactions at once. Add more
                transactions to this batch by interacting with a connected
                dApp right now. Alternatively, you may click "Back" to add
                more transactions.
              </span>
            </>
          )
        }
      </div>
    </Panel>
  );
};

export default TransactionPanel;
