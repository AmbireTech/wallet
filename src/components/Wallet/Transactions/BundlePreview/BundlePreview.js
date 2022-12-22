import styles from './BundlePreview.module.scss'
import TxnPreview from 'components/common/TxnPreview/TxnPreview'
import { BsCoin, BsCalendarWeek, BsGlobe2 } from 'react-icons/bs'
import { MdShuffle, MdOutlineSavings } from 'react-icons/md'
import networks from 'consts/networks'
import { getTransactionSummary } from 'lib/humanReadableTransactions'

import React from 'react'
import { formatFloatTokenAmount } from 'lib/formatters'
import { formatUnits } from 'ethers/lib/utils'
import { ToolTip } from 'components/common'
// eslint-disable-next-line import/no-relative-parent-imports
import { getAddedGas } from '../../../SendTransaction/helpers'
import useConstants from 'hooks/useConstants'
import cn from 'classnames'

const TO_GAS_TANK = `to Gas Tank`

const BundlePreview = React.memo(({ bundle, mined = false, feeAssets }) => {
  const {
    constants: { tokenList, humanizerInfo },
  } = useConstants();
  const network = networks.find((x) => x.id === bundle.network);
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
  const txns =
    hasFeeMatch && !bundle.gasTankFee ? bundle.txns.slice(0, -1) : bundle.txns;
  const toLocaleDateTime = (date) =>
    `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  const feeTokenDetails = feeAssets
    ? feeAssets.find((i) => i.symbol === bundle.feeToken)
    : null;
  const savedGas = feeTokenDetails ? getAddedGas(feeTokenDetails) : null;
  const splittedLastTxnSummary = lastTxnSummary.split(" ");
  const fee = splittedLastTxnSummary.length
    ? splittedLastTxnSummary[1] + " " + splittedLastTxnSummary[2]
    : [];
  const cashback =
    bundle.gasTankFee && bundle.gasTankFee.cashback && feeTokenDetails
      ? formatUnits(
          bundle.gasTankFee.cashback.toString(),
          feeTokenDetails?.decimals
        ).toString() * feeTokenDetails?.price
      : 0;
  const totalSaved = savedGas && bundle.feeInUSDPerGas * savedGas + cashback;

  return (
    <div className={cn(styles.bundlePreview, styles.bundle)} key={bundle._id}>
      {txns.map((txn, i) => (
        <TxnPreview
          key={i} // safe to do this, individual TxnPreviews won't change within a specific bundle
          txn={txn}
          network={bundle.network}
          account={bundle.identity}
          mined={mined}
          addressLabel={!!bundle.meta && bundle.meta.addressLabel}
          feeAssets={feeAssets}
        />
      ))}
      <ul className={styles.details}>
        {hasFeeMatch && !bundle.gasTankFee ? (
          <li>
            <label>
              <BsCoin />
              Fee
            </label>
            <p>
              {fee
                .split(" ")
                .map((x, i) =>
                  i === 0 ? formatFloatTokenAmount(x, true, 8) : x
                )
                .join(" ")}
            </p>
          </li>
        ) : null}
        {bundle.executed && !bundle.executed.success && (
          <li>
            <label>Error</label>
            <p>{bundle.executed.errorMsg || "unknown error"}</p>
          </li>
        )}
        {bundle.gasTankFee && feeTokenDetails !== null && mined && (
          <>
            {savedGas && (
              <ToolTip
                label={`
                You saved $ ${formatFloatTokenAmount(
                  bundle.feeInUSDPerGas * savedGas,
                  true,
                  6
                )}, ${
                  cashback > 0
                    ? `and got back $ ${formatFloatTokenAmount(
                        cashback,
                        true,
                        6
                      )} as cashback,`
                    : ""
                } ended up paying only $ ${formatFloatTokenAmount(
                  bundle.feeInUSDPerGas * bundle.gasLimit - cashback,
                  true,
                  6
                )}
              `}
              >
                <li>
                  <label>
                    <BsCoin />
                    Fee (Paid with Gas Tank)
                  </label>
                  <p>
                    ${" "}
                    {formatFloatTokenAmount(
                      bundle.feeInUSDPerGas * bundle.gasLimit - cashback,
                      true,
                      6
                    )}
                  </p>
                </li>
              </ToolTip>
            )}
            {savedGas && (
              <ToolTip
                label={`
                Saved: $ ${formatFloatTokenAmount(
                  bundle.feeInUSDPerGas * savedGas,
                  true,
                  6
                )}
                ${
                  cashback > 0
                    ? `Cashback: $ ${formatFloatTokenAmount(cashback, true, 6)}`
                    : ""
                }
              `}
              >
                <li>
                  <label>
                    <MdOutlineSavings />
                    Total Saved
                  </label>
                  $ {formatFloatTokenAmount(totalSaved, true, 6)}
                </li>
              </ToolTip>
            )}
          </>
        )}
        <li>
          <label>
            <BsCalendarWeek />
            Submitted on
          </label>
          <p>
            {bundle.submittedAt &&
              toLocaleDateTime(new Date(bundle.submittedAt)).toString()}
          </p>
        </li>
        {bundle.gasTankFee && !mined && (
          <li>
            <label>
              <MdOutlineSavings />
              Saved by Gas Tank
            </label>
            ${" "}
            {formatFloatTokenAmount(bundle.feeInUSDPerGas * savedGas, true, 6)}
            <span style={{ color: "#ebaf40" }}>+ cashback is pending</span>
          </li>
        )}
        {bundle.replacesTxId ? (
          <li>
            <label>
              <MdShuffle />
              Replaces transaction
            </label>
            <p>{bundle.replacesTxId}</p>
          </li>
        ) : null}
        {bundle.txId ? (
          <li>
            <label>
              <BsGlobe2 />
              Block Explorer
            </label>
            <p>
              <a
                className={styles.explorerUrl}
                href={network.explorerUrl + "/tx/" + bundle.txId}
                target="_blank"
                rel="noreferrer"
              >
                {network.explorerUrl.split("/")[2]}
              </a>
            </p>
          </li>
        ) : null}
      </ul>
    </div>
  );
});

export default BundlePreview;
