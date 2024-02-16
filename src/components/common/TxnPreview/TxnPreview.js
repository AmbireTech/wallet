/* eslint-disable import/no-cycle */
import cn from 'classnames'
import { useEffect, useState } from 'react'
import { formatUnits } from 'ethers/lib/utils'

import networks from 'consts/networks'
import {
  setKnownAddressNames,
  getName,
  getTransactionSummary,
  isKnown
} from 'lib/humanReadableTransactions'

import useConstants from 'hooks/useConstants'
import { ToolTip } from 'components/common'

import { ReactComponent as ChevronDownIcon } from 'resources/icons/chevron-down.svg'
import { ReactComponent as TrashIcon } from 'resources/icons/trash.svg'
import ExtendedSummaryItem from './ExtendedSummaryItem/ExtendedSummaryItem'

import styles from './TxnPreview.module.scss'

const SIG_HASH_NFT_APPROVAL_FOR_ALL = '0xa22cb465'

function getNetworkSymbol(networkId) {
  const network = networks.find((x) => x.id === networkId)
  return network ? network.nativeAssetSymbol : 'UNKNW'
}

export default function TxnPreview({
  txn,
  onDismiss,
  network,
  account,
  isFirstFailing,
  mined,
  disableExpand,
  disableDismiss,
  disableDismissLabel,
  addressLabel = null,
  feeAssets,
  meta = null
}) {
  const {
    constants: { tokenList, humanizerInfo }
  } = useConstants()
  const [isExpanded, setExpanded] = useState(false)
  const contractName = getName(humanizerInfo, txn[0])
  const isNFTApprovalForAll =
    txn.length && !!txn[2] ? txn[2].slice(0, 10) === SIG_HASH_NFT_APPROVAL_FOR_ALL : null

  const networkDetails = networks.find(({ id }) => id === network)
  const extendedSummary = getTransactionSummary(humanizerInfo, tokenList, txn, network, account, {
    mined,
    extended: true,
    meta
  })

  const hasUnknownAddress = extendedSummary
    .map((summary) => {
      return !Array.isArray(summary)
        ? []
        : summary
            .map((item) => {
              if (['address', 'token'].includes(item.type) && item.address) {
                return !isKnown(humanizerInfo, item.address, account)
              }
              return false
            })
            .includes(true)
    })
    .includes(true)

  const isUnknown = !mined && (!isKnown(humanizerInfo, txn[0], account) || hasUnknownAddress)

  useEffect(() => !!addressLabel && setKnownAddressNames(addressLabel), [addressLabel])

  return (
    <div className={cn(styles.wrapper, { [styles.firstFailing]: isFirstFailing })}>
      <div className={styles.heading}>
        <button
          type="button"
          className={styles.info}
          onClick={() => !disableExpand && setExpanded((e) => !e)}
        >
          <div className={styles.summaryContainer}>
            {!disableExpand && (
              <div className={cn(styles.expandTxn, { [styles.reversedChevron]: isExpanded })}>
                <ChevronDownIcon className={styles.icon} />
              </div>
            )}
            <div className={styles.summary}>
              {extendedSummary.map((entry) => {
                // If entry is extended summary parse it
                if (Array.isArray(entry)) {
                  return entry.map((item, i) => (
                    <ExtendedSummaryItem
                      key={`item-${i}`}
                      item={item}
                      i={i}
                      networkDetails={networkDetails}
                      feeAssets={feeAssets}
                    />
                  ))
                }
                if (typeof entry !== 'string') {
                  return `operation with address ${txn[0]} (unable to parse)`
                }
                return entry
              })}
            </div>
            {onDismiss ? (
              <div className={styles.dissmissTxnWrapper}>
                <ToolTip
                  disabled={!disableDismiss || !disableDismissLabel}
                  label={disableDismissLabel}
                >
                  <button
                    type="button"
                    className={cn(styles.dismissTxn, { [styles.disabled]: disableDismiss })}
                    onClick={(e) => {
                      e.stopPropagation()
                      !disableDismiss && onDismiss.apply(this, e)
                    }}
                  >
                    <TrashIcon className={styles.icon} />
                  </button>
                </ToolTip>
              </div>
            ) : null}
          </div>
          {isFirstFailing && (
            <p className={styles.warning}>This is the first failing transaction.</p>
          )}
          {isUnknown && (
            <p className={styles.warning}>
              Warning: interacting with an unknown contract or address.
            </p>
          )}
          {isNFTApprovalForAll && (
            <p className={styles.warning}>
              Warning: Be careful while approving this permission, as it will allow access to all
              NFTs on the contract, including those that you may own in the future. The recipient of
              this permission can transfer NFTs from your wallet without seeking your permission
              until you withdraw this authorization. Proceed with caution and stay safe!
            </p>
          )}
        </button>
      </div>
      {isExpanded ? (
        <div className={styles.advanced}>
          <p>
            Interacting with (<i>to</i>): {txn[0]}
            {contractName ? ` (${contractName})` : ''}
          </p>
          <p>
            Value to be sent (<i>value</i>): {formatUnits(txn[1] || '0x0', 18)}{' '}
            {getNetworkSymbol(network)}
          </p>
          <p>Data: {txn[2]}</p>
        </div>
      ) : null}
    </div>
  )
}
