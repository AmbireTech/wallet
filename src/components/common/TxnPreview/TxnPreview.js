import './TxnPreview.css'

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
  const contractName = getContractName(txn, network)
  return (
    <div className={isFirstFailing ? 'txnPreview firstFailing' : 'txnPreview'}>
        <div>{getTransactionSummary(txn, network, account)}</div>
        {isFirstFailing ? (<div className='firstFailingLabel'>This is the first failing transaction.</div>) : (<></>)}

        {
          isExpanded ? (<div className='advanced'>
            <div><b>Interacting with (<i>to</i>):</b> {txn[0]}{contractName ? ` (${contractName})` : ''}</div>
            <div><b>{getNetworkSymbol(network)} to be sent (<i>value</i>):</b> {formatUnits(txn[1], 18)}</div>
            <div><b>Data:</b> {txn[2]}</div>
          </div>) : (<></>)
        }

        <div className='actionIcons'>
          <span className='expandTxn' onClick={() => setExpanded(e => !e)}>
            {isExpanded ? (<FaChevronUp/>) : (<FaChevronDown/>)}
          </span>
          {onDismiss ? (<span className='dismissTxn' onClick={onDismiss}><FaTimes/></span>) : (<></>)}
        </div>
    </div>
  )
}
