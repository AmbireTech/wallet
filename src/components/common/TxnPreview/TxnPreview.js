import './TxnPreview.scss'

import { useState } from 'react'
import { FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa'

import { getName, getTransactionSummary, isKnown } from '../../../lib/humanReadableTransactions'
import networks from '../../../consts/networks'
import { formatUnits } from 'ethers/lib/utils'

function getNetworkSymbol(networkId) {
  const network = networks.find(x => x.id === networkId)
  return network ? network.nativeAssetSymbol : 'UNKNW'
}
export default function TxnPreview ({ txn, onDismiss, network, account, isFirstFailing, mined }) {
  const [isExpanded, setExpanded] = useState(false)
  const contractName = getName(txn[0], network)
  return (
    <div className={isFirstFailing ? 'txnPreview firstFailing' : 'txnPreview'}>
        <div className="heading" onClick={() => setExpanded(e => !e)}>
          <div className="info">
            <div className="summary-container">
              <div className='expandTxn'>
                {isExpanded ? (<FaChevronDown/>) : (<FaChevronUp/>)}
              </div>
              <div className="summary">{getTransactionSummary(txn, network, account, { mined })}</div>
            </div>
            {isFirstFailing && (<div className='firstFailingLabel'>This is the first failing transaction.</div>)}
            {!isFirstFailing && !mined && !isKnown(txn, account) && (<div className='unknownWarning'>Warning: interacting with an unknown contract or address.</div>)}
          </div>
          <div className='actionIcons'>
              {onDismiss ? (<span className='dismissTxn' onClick={onDismiss}><FaTimes/></span>) : (<></>)}
            </div>
        </div>
        {
          isExpanded ? (<div className='advanced'>
            <div><b>Interacting with (<i>to</i>):</b> {txn[0]}{contractName ? ` (${contractName})` : ''}</div>
            <div><b>{getNetworkSymbol(network)} to be sent (<i>value</i>):</b> {formatUnits(txn[1] || '0x0', 18)}</div>
            <div><b>Data:</b> {txn[2]}</div>
          </div>) : (<></>)
        }
    </div>
  )
}
