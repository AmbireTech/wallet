import './TxnPreview.scss'

import { useState, Fragment, useEffect  } from 'react'

import { getName, getTransactionSummary, isKnown } from 'lib/humanReadableTransactions'
import networks from 'consts/networks'
import { formatUnits } from 'ethers/lib/utils'
import { ToolTip } from 'components/common'
import { HiOutlineExternalLink } from 'react-icons/hi'
import { MdOutlineClose } from 'react-icons/md'
import { BsChevronDown, BsChevronUp } from 'react-icons/bs'
import { getTokenIcon } from 'lib/icons'
import { formatFloatTokenAmount } from 'lib/formatters'
import { setKnownAddressNames } from 'lib/humanReadableTransactions'
import useConstants from 'hooks/useConstants'

function getNetworkSymbol(networkId) {
  const network = networks.find(x => x.id === networkId)
  return network ? network.nativeAssetSymbol : 'UNKNW'
}

function parseExtendedSummaryItem(item, i, networkDetails, feeAssets) {
  if (item.length === 1) return item

  if (i === 0) return (<div className={`action ${item.toLowerCase()}`} key={`item-${i}`}>{ item }</div>)

  if (!item.type) return (<div className='word' key={`item-${i}`}>{ item }</div>)
  if (item.type === 'token') {
    const foundToken = feeAssets && feeAssets.find(i => (i.address === item.address) && (i.symbol.toLowerCase() === item.symbol.toLowerCase()))
    return (
    <div className='token' key={`item-${i}`}>
      { item.amount > 0 && <span>{ formatFloatTokenAmount(item.amount, true, item.decimals) }</span> }
      { item.decimals !== null && item.symbol ? 
        <Fragment>
          {item.address &&
            <div className='icon' 
              style={{ backgroundImage: `url(${foundToken ? foundToken.icon : getTokenIcon(networkDetails.id, item.address)})` }}>
            </div>}
          {item.symbol}
        </Fragment>
        : (item.amount > 0) ? 'units of unknown token' : null 
      }
    </div>
  )}

  if (item.type === 'address') return (
    <a
      className='address'
      key={`item-${i}`}
      href={item.address ? `${networkDetails.explorerUrl}/address/${item.address}` : null}
      target="_blank"
      rel="noreferrer"
      onClick={e => e.stopPropagation()}
    >
      <ToolTip disabled={!item.address} label={item.address}>
        { item.name ? item.name : item.address }
        { item.address ? <HiOutlineExternalLink/> : null }
      </ToolTip>
    </a>
  )

  if (item.type === 'network') return (
    <div className='network' key={`item-${i}`}>
      { item.icon ? <div className='icon' style={{ backgroundImage: `url(${item.icon})` }}></div> : null }
      { item.name }
    </div>
  )

  if (item.type === 'erc721') {
    const canShowLink = item.network && item.address && item.id
    return (
      <a
        className='erc721'
        key={`item-${i}`}
        href={canShowLink ? `#/wallet/nft/${item.network}/${item.address}/${item.id}` : null}
        target="_blank"
        rel="noreferrer"
        onClick={e => e.stopPropagation()}
      >
        { item.name }
        { canShowLink ? <HiOutlineExternalLink/> : null }
      </a>
    )
  }

  return <></>
}

export default function TxnPreview ({ txn, onDismiss, network, account, isFirstFailing, mined, disableExpand, disableDismiss, disableDismissLabel, addressLabel = null, feeAssets }) {
  const { constants: { tokenList, humanizerInfo } } = useConstants()
  const [isExpanded, setExpanded] = useState(false)
  const contractName = getName(humanizerInfo, txn[0])

  const networkDetails = networks.find(({ id }) => id === network)
  const extendedSummary = getTransactionSummary(humanizerInfo, tokenList, txn, network, account, { mined, extended: true })

  const summary = (extendedSummary.map(entry => Array.isArray(entry) ? entry.map((item, i) => parseExtendedSummaryItem(item, i, networkDetails, feeAssets)) : (entry))) // If entry is extended summary parse it
  useEffect(() => !!addressLabel && setKnownAddressNames(addressLabel), [addressLabel])
  
  return (
    <div className={isFirstFailing ? 'txnPreview firstFailing' : 'txnPreview'}>
        <div className="heading">
          <div className="info" onClick={() => !disableExpand && setExpanded(e => !e)}>
            <div className="summary-container">
              {!disableExpand && (<div className='expandTxn'>
                {isExpanded ? (<BsChevronUp/>) : (<BsChevronDown/>)}
              </div>)}
              <div className="summary">{ summary }</div>
            </div>
            {isFirstFailing && (<div className='firstFailingLabel'>This is the first failing transaction.</div>)}
              {!isFirstFailing && !mined && !isKnown(humanizerInfo, txn, account) && (<div className='unknownWarning'>Warning: interacting with an unknown contract or address.</div>)}
          </div>
          <div className='actionIcons'>
            {onDismiss ? (
              <ToolTip disabled={!disableDismiss || !disableDismissLabel} label={disableDismissLabel}>
                <div className={`dismissTxn ${disableDismiss ? 'disabled' : ''}`} onClick={e => { e.stopPropagation(); !disableDismiss && onDismiss.apply(this, e) }}><MdOutlineClose/></div>
              </ToolTip>
            ) : (<></>)}
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
