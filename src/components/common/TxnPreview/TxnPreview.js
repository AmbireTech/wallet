import cn from 'classnames'
import { useEffect, useState } from 'react'
import { formatUnits } from 'ethers/lib/utils'

import networks from 'consts/networks'
import { setKnownAddressNames } from 'lib/humanReadableTransactions'
import { getName, getTransactionSummary, isKnown } from 'lib/humanReadableTransactions'

import useConstants from 'hooks/useConstants'
import { ToolTip } from 'components/common'
import ExtendedSummaryItem from './ExtendedSummaryItem/ExtendedSummaryItem'

import { ReactComponent as ChevronDownIcon } from 'resources/icons/chevron-down.svg'
import { ReactComponent as TrashIcon } from 'resources/icons/trash.svg'

import styles from './TxnPreview.module.scss'

function getNetworkSymbol(networkId) {
  const network = networks.find(x => x.id === networkId)
  return network ? network.nativeAssetSymbol : 'UNKNW'
}

export default function TxnPreview ({ txn, onDismiss, network, account, isFirstFailing, mined, disableExpand, disableDismiss, disableDismissLabel, addressLabel = null, feeAssets, meta = null }) {
  const { constants: { tokenList, humanizerInfo } } = useConstants()
  const [isExpanded, setExpanded] = useState(false)
  const contractName = getName(humanizerInfo, txn[0])
  const isUnknown = !isFirstFailing && !mined && !isKnown(humanizerInfo, txn, account)
  
  const networkDetails = networks.find(({ id }) => id === network)
  const extendedSummary = getTransactionSummary(humanizerInfo, tokenList, txn, network, account, { mined, extended: true, meta })

  useEffect(() => !!addressLabel && setKnownAddressNames(addressLabel), [addressLabel])

  return (
    <div className={cn(styles.wrapper, {[styles.firstFailing]: isFirstFailing})}>
        <div className={styles.heading}>
          <div className={styles.info} onClick={() => !disableExpand && setExpanded(e => !e)}>
            <div className={styles.summaryContainer}>
              {!disableExpand && (<div className={cn(styles.expandTxn, {[styles.reversedChevron]: isExpanded})}>
                <ChevronDownIcon className={styles.icon} />
              </div>)}
              <div className={styles.summary}>
                {extendedSummary.map(entry => { // If entry is extended summary parse it
                  if(Array.isArray(entry)) {
                    return entry.map((item, i) => (
                      <ExtendedSummaryItem 
                        key={`item-${i}`}
                        item={item}
                        i={i}
                        networkDetails={networkDetails}
                        feeAssets={feeAssets}
                      />
                    ))
                  } else if (typeof entry !== 'string') {
                    return `operation with address ${txn[0]} (unable to parse)`
                  } else return entry 
                })}
              </div>
              {onDismiss ? (<div className={styles.dissmissTxnWrapper}>
                <ToolTip disabled={!disableDismiss || !disableDismissLabel} label={disableDismissLabel}>
                  <div 
                    className={cn(styles.dismissTxn, {[styles.disabled]: disableDismiss})} 
                    onClick={e => { e.stopPropagation(); !disableDismiss && onDismiss.apply(this, e) }}
                  >
                    <TrashIcon className={styles.icon} />
                  </div>
                </ToolTip>
              </div>) : null}
            </div>
            {isFirstFailing && (<p className={styles.warning}>This is the first failing transaction.</p>)}
            {isUnknown && (<p className={styles.warning}>Warning: interacting with an unknown contract or address.</p>)}
          </div>
        </div>
        {isExpanded ? (<div className={styles.advanced}>
          <p>Interacting with (<i>to</i>): {txn[0]}{contractName ? ` (${contractName})` : ''}</p>
          <p>Value to be sent (<i>value</i>): {formatUnits(txn[1] || '0x0', 18)} {getNetworkSymbol(network)}</p>
          <p>Data: {txn[2]}</p>
        </div>) : null}
    </div>
  )
}
