import cn from 'classnames'

import { Panel, Alert } from 'components/common'
import TxnPreview from 'components/common/TxnPreview/TxnPreview'

import styles from './TransactionPanel.module.scss'
import { isGasTankCommitment } from 'lib/isGasTankCommitment'

const TransactionPanel = ({
  bundle,
  estimation,
  REJECT_MSG,
  resolveMany,
  signingStatus,
  panelClassName,
  panelTitleClassName
}) => {
  // Note<Bobby>: remove the gasTank transaction to the feeCollector
  // the feeCollector is an EOA so normal req to it should not have
  // data (txn[2]). If they have, it probably means this is the
  // gasTank transaction which we do not show in the preview
  const filteredTxn = bundle.txns.filter(txn => !isGasTankCommitment(txn))

  return (
    <Panel className={cn(panelClassName, styles.wrapper)}>
      <div className={styles.panelBody}>
        <h2 className={cn(panelTitleClassName, styles.title)}>
          {filteredTxn.length} Transaction{filteredTxn.length > 1 ? 's' : ''} Waiting
        </h2>
        <div
          className={cn(styles.listOfTransactions, {
            [styles.frozen]: !bundle.requestIds
          })}
        >
          {filteredTxn.map((txn, i) => {
            const isFirstFailing =
              estimation && !estimation.success && estimation.firstFailing === i
            // we need to re-render twice per minute cause of DEX deadlines
            const min = Math.floor(Date.now() / 30000)
            return (
              <TxnPreview
                key={[...txn, i].join(':')}
                // pasing an unused property to make it update
                minute={min}
                onDismiss={
                  bundle.requestIds &&
                  (() =>
                    resolveMany([bundle.requestIds[i]], {
                      message: REJECT_MSG
                    }))
                }
                txn={txn}
                network={bundle.network}
                account={bundle.identity}
                isFirstFailing={isFirstFailing}
                disableDismiss={!!signingStatus}
                disableDismissLabel="Cannot modify transaction bundle while a signing procedure is pending"
                addressLabel={!!bundle.meta && bundle.meta.addressLabel}
                meta={!!bundle.meta && bundle.meta}
              />
            )
          })}
        </div>
      </div>
      {bundle.requestIds && (
        <Alert
          title="Degen tip"
          type="degenTip"
          text="
          You can sign multiple transactions at once. Add more
          transactions to this batch by interacting with a connected
          dApp right now. Alternatively, you may click 'Back' to add
          more transactions.
        "
          iconNextToTitle
        />
      )}
    </Panel>
  )
}

export default TransactionPanel
