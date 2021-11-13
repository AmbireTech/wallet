import { useState } from 'react'
import { FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa'

import { getContractName, getTransactionSummary } from '../../../lib/humanReadableTransactions'
import { formatUnits } from 'ethers/lib/utils'

export default function TxnPreview ({ txn, onDismiss, bundle, network, isFirstFailing }) {
  const [isExpanded, setExpanded] = useState(false)
  const contractName = getContractName(txn, network.id)
  return (
    <div className={isFirstFailing ? 'txnSummary firstFailing' : 'txnSummary'}>
        <div>{getTransactionSummary(txn, bundle.network, bundle.identity)}</div>
        {isFirstFailing ? (<div className='firstFailingLabel'>This is the first failing transaction.</div>) : (<></>)}

        {
          isExpanded ? (<div className='advanced'>
            <div><b>Interacting with (<i>to</i>):</b> {txn[0]}{contractName ? ` (${contractName})` : ''}</div>
            <div><b>{network.nativeAssetSymbol} to be sent (<i>value</i>):</b> {formatUnits(txn[1], 18)}</div>
            <div><b>Data:</b> {txn[2]}</div>
          </div>) : (<></>)
        }

        <span className='expandTxn' onClick={() => setExpanded(e => !e)}>
          {isExpanded ? (<FaChevronUp/>) : (<FaChevronDown/>)}
        </span>
        {onDismiss ? (<span className='dismissTxn' onClick={onDismiss}><FaTimes/></span>) : (<></>)}
    </div>
  )
}
