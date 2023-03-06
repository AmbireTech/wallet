import React from 'react'

import { getTransactionSummary } from 'lib/humanReadableTransactions'

import useConstants from 'hooks/useConstants'
import { TxnPreview } from 'components/common'
import Details from './Details/Details'

import styles from './BundlePreview.module.scss'

const TO_GAS_TANK = `to Gas Tank`

const BundlePreview = ({ bundle, mined = false, feeAssets }) => {
  const {
    constants: { tokenList, humanizerInfo },
  } = useConstants();
  if (!Array.isArray(bundle.txns))
    return (
      <h3 className={styles.error}>
        Bundle has no transactions (should never happen)
      </h3>
    );
  const lastTxn = bundle.txns[bundle.txns.length - 1];
  // terribly hacky; @TODO fix
  // all of the values are prob checksummed so we may not need toLowerCase
  const lastTxnSummary = getTransactionSummary(
    humanizerInfo,
    tokenList,
    lastTxn,
    bundle.network,
    bundle.identity
  );
  const hasFeeMatch =
    bundle.txns.length > 1 &&
    lastTxnSummary.match(new RegExp(TO_GAS_TANK, "i"));
  const txns = hasFeeMatch && !bundle.gasTankFee ? bundle.txns.slice(0, -1) : bundle.txns;


  return (
    <div className={styles.wrapper} key={bundle._id}>
      {txns.map((txn, i) => (
        <TxnPreview
          key={i} // safe to do this, individual TxnPreviews won't change within a specific bundle
          txn={txn}
          network={bundle.network}
          account={bundle.identity}
          mined={mined}
          addressLabel={!!bundle.meta && bundle.meta.addressLabel}
          feeAssets={feeAssets}
          meta={!!bundle.meta && bundle.meta}
        />
      ))}
      <Details
        bundle={bundle}
        mined={mined}
        feeAssets={feeAssets}
        lastTxnSummary={lastTxnSummary}
        hasFeeMatch={hasFeeMatch}
      />
    </div>
  );
}

export default React.memo(BundlePreview);
