import { formatUnits } from 'ethers/lib/utils'

import networks from 'consts/networks'
import { formatFloatTokenAmount } from 'lib/formatters'
import { ToolTip } from 'components/common'
import { getAddedGas } from 'components/SendTransaction/helpers'
import DetailsItem from './DetailsItem/DetailsItem'

import styles from './Details.module.scss'

const toLocaleDateTime = (date) => `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`

const getCashback = (bundle, feeTokenDetails) => {
  if (bundle.gasTankFee && bundle.gasTankFee.cashback && feeTokenDetails) {
    return (
      formatUnits(bundle.gasTankFee.cashback.toString(), feeTokenDetails?.decimals).toString() *
      feeTokenDetails?.price
    )
  }

  return 0
}

const Details = ({
  bundle,
  mined,
  feeAssets,
  lastTxnSummary,
  hasFeeMatch,
  lastTxnExtendedSummary
}) => {
  const network = networks.find((x) => x.id === bundle.network)
  const feeToken =
    bundle.feeToken ||
    (hasFeeMatch &&
      bundle.gasTankFee &&
      lastTxnExtendedSummary.flat()[1] &&
      lastTxnExtendedSummary.flat()[1].symbol.toLowerCase()) ||
    null
  const feeTokenDetails = feeAssets ? feeAssets.find((i) => i.symbol === feeToken) : null
  const savedGas = feeTokenDetails ? getAddedGas(feeTokenDetails) : null
  const splittedLastTxnSummary = lastTxnSummary.split(' ')
  const fee = splittedLastTxnSummary.length
    ? `${splittedLastTxnSummary[1]} ${splittedLastTxnSummary[2]}`
    : []
  const cashback = getCashback(bundle, feeTokenDetails)
  const totalSaved = savedGas && bundle.feeInUSDPerGas * savedGas + cashback

  return (
    <div className={styles.wrapper}>
      {hasFeeMatch && !bundle.gasTankFee ? (
        <DetailsItem
          title="Fee"
          text={fee
            .split(' ')
            .map((x, i) => (i === 0 ? formatFloatTokenAmount(x, true, 8) : x))
            .join(' ')}
        />
      ) : null}
      {bundle.executed && !bundle.executed.success && (
        <DetailsItem title="Error" text={bundle.executed.errorMsg || 'unknown error'} />
      )}
      {bundle.gasTankFee &&
        cashback &&
        !bundle.gasTankFee.cashback.value &&
        hasFeeMatch &&
        mined && (
          <ToolTip
            label={`
                You paid: $ ${formatFloatTokenAmount(
                  bundle.feeInUSDPerGas * bundle.gasLimit + cashback,
                  true,
                  6
                )}
                ${
                  cashback > 0
                    ? `and got back $ ${formatFloatTokenAmount(cashback, true, 6)} as cashback`
                    : ''
                }
              `}
          >
            <DetailsItem
              title="Fee (Cashback)"
              text={`$ ${formatFloatTokenAmount(cashback, true, 6)}`}
            />
          </ToolTip>
        )}

      {bundle.gasTankFee && bundle.gasTankFee?.value && feeTokenDetails !== null && mined && (
        <>
          {savedGas && (
            <ToolTip
              label={`
                You saved $ ${formatFloatTokenAmount(bundle.feeInUSDPerGas * savedGas, true, 6)}, ${
                cashback > 0
                  ? `and got back $ ${formatFloatTokenAmount(cashback, true, 6)} as cashback,`
                  : ''
              } ended up paying only $ ${formatFloatTokenAmount(
                bundle.feeInUSDPerGas * bundle.gasLimit - cashback,
                true,
                6
              )}
              `}
            >
              <DetailsItem
                title="Fee (Paid with Gas Tank)"
                text={`$ ${formatFloatTokenAmount(
                  bundle.feeInUSDPerGas * bundle.gasLimit - cashback,
                  true,
                  6
                )}`}
              />
            </ToolTip>
          )}
          {savedGas && (
            <ToolTip
              label={`
                Saved: $ ${formatFloatTokenAmount(bundle.feeInUSDPerGas * savedGas, true, 6)}
                ${cashback > 0 ? `Cashback: $ ${formatFloatTokenAmount(cashback, true, 6)}` : ''}
              `}
            >
              <DetailsItem
                title="Total Saved"
                text={`$ ${formatFloatTokenAmount(totalSaved, true, 6)}`}
              />
            </ToolTip>
          )}
        </>
      )}
      <DetailsItem
        title="Submitted on"
        text={bundle.submittedAt && toLocaleDateTime(new Date(bundle.submittedAt)).toString()}
      />
      {bundle.gasTankFee && !mined && (
        <DetailsItem
          title="Saved by Gas Tank"
          text={
            <>
              $ {formatFloatTokenAmount(bundle.feeInUSDPerGas * savedGas, true, 6)}
              <span style={{ color: '#ebaf40' }}>+ cashback is pending</span>
            </>
          }
        />
      )}
      {bundle.replacesTxId ? (
        <DetailsItem title="Replaces transaction" text={bundle.replacesTxId} />
      ) : null}
      {bundle.txId ? (
        <DetailsItem
          title="Block Explorer"
          text={
            <a
              className={styles.explorerUrl}
              href={`${network.explorerUrl}/tx/${bundle.txId}`}
              target="_blank"
              rel="noreferrer"
            >
              {network.explorerUrl.split('/')[2]}
            </a>
          }
        />
      ) : null}
    </div>
  )
}

export default Details
