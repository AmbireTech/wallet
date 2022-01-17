import './TxnPreview.scss'

import { useState } from 'react'
import { FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa'

import { getName, getTransactionSummary, isKnown } from 'lib/humanReadableTransactions'
import networks from 'consts/networks'
import { formatUnits } from 'ethers/lib/utils'

const zapperStorageTokenIcons = 'https://storage.googleapis.com/zapper-fi-assets/tokens'

function getTokenIcon(network, address) {
  return `${zapperStorageTokenIcons}/${network}/${address}.png`
}

function getNetworkSymbol(networkId) {
  const network = networks.find(x => x.id === networkId)
  return network ? network.nativeAssetSymbol : 'UNKNW'
}
export default function TxnPreview ({ txn, onDismiss, network, account, isFirstFailing, mined, disableExpand }) {
  const [isExpanded, setExpanded] = useState(false)
  const contractName = getName(txn[0], network)

  const summary = () => {
    const extendedSummary = getTransactionSummary(txn, network, account, { mined, extended: true })

    return extendedSummary.map((item, i) => {
      if (i === 0) return (<div className='action'>{ item }</div>)
      if (!item.type) return (<div className='word'>{ item }</div>)
      if (item.type === 'token') return (
        <div className='token'>
          { item.amount > 0 ? item.amount : null }
          <div className='icon' style={{ backgroundImage: `url(${getTokenIcon(network, item.address)})` }}></div>
          { item.symbol }
        </div>
      )
      if (item.type === 'address') return (
        <div className='address'>
          { item.name ? <>{ item.name } { item.address ? <span>({ item.address })</span> : null }</> : item.address }
        </div>
      )
    })
  }

  return (
    <div className={isFirstFailing ? 'txnPreview firstFailing' : 'txnPreview'}>
        <div className="heading">
          <div className="info" onClick={() => !disableExpand && setExpanded(e => !e)}>
            <div className="summary-container">
              {!disableExpand && (<div className='expandTxn'>
                {isExpanded ? (<FaChevronDown/>) : (<FaChevronUp/>)}
              </div>)}
              <div className="summary">{summary()}</div>
            </div>
            {isFirstFailing && (<div className='firstFailingLabel'>This is the first failing transaction.</div>)}
            {!isFirstFailing && !mined && !isKnown(txn, account) && (<div className='unknownWarning'>Warning: interacting with an unknown contract or address.</div>)}
          </div>
          <div className='actionIcons'>
              {onDismiss ? (<span className='dismissTxn' onClick={e => { e.stopPropagation(); onDismiss.apply(this, e) }}><FaTimes/></span>) : (<></>)}
            </div>
        </div>
        {
          isExpanded ? (<div className='advanced'>
            <div><b>Interacting with (<i>to</i>):</b> {txn[0]}{contractName ? ` (${contractName})` : ''}</div>
            <div><b>Value to be sent (<i>value</i>):</b> {formatUnits(txn[1] || '0x0', 18)} {getNetworkSymbol(network)}</div>
            <div><b>Data:</b> {txn[2]}</div>
          </div>) : (<></>)
        }
    </div>
  )
}
