import './TxnPreview.scss'

import { useState } from 'react'
import { FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa'

import { getContractName, getTransactionSummary } from '../../../lib/humanReadableTransactions'
import networks from '../../../consts/networks'
import { formatUnits } from 'ethers/lib/utils'

function getNetworkSymbol(networkId) {
  const network = networks.find(x => x.id === networkId)
  return network ? network.nativeAssetSymbol : 'UNKNW'
}
export default function TxnPreview ({ txn, onDismiss, network, account, isFirstFailing }) {
  const [isExpanded, setExpanded] = useState(false)
  const contractName = getContractName(txn[0], network)
  return (
    <div className={isFirstFailing ? 'txnPreview firstFailing' : 'txnPreview'}>
        <div className="heading" onClick={() => setExpanded(e => !e)}>
          <div className="info">
            <div className="summary-container">
              <div className='expandTxn'>
                {isExpanded ? (<FaChevronUp/>) : (<FaChevronDown/>)}
              </div>
              <div className="summary">{getTransactionSummary(txn, network, account)}</div>
            </div>
            {isFirstFailing ? (<div className='firstFailingLabel'>This is the first failing transaction.</div>) : (<></>)}
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
