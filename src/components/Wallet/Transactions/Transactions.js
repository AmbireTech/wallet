import './Transactions.scss'
import { BsCoin, BsCalendarWeek, BsGlobe2, BsCheck2All } from 'react-icons/bs'
import { MdOutlinePendingActions } from 'react-icons/md'
import { useRelayerData } from '../../../hooks'
import TxnPreview from '../../common/TxnPreview/TxnPreview'
import { Loading } from '../../common'
import accountPresets from '../../../consts/accountPresets'
import networks from '../../../consts/networks'
import { getTransactionSummary } from '../../../lib/humanReadableTransactions'
import { Bundle } from 'adex-protocol-eth'
import { useEffect, useState } from 'react'
import fetch from 'node-fetch'
import { useToasts } from '../../../hooks/toasts'

function Transactions ({ relayerURL, selectedAcc, selectedNetwork, showSendTxns }) {
  const { addToast } = useToasts()
  const [cacheBreak, setCacheBreak] = useState(() => Date.now())
  // @TODO refresh this after we submit a bundle; perhaps with the upcoming transactions service
  // We want this pretty much on every rerender with a 5 sec debounce
  useEffect(() => {
    if ((Date.now() - cacheBreak) > 5000) setCacheBreak(Date.now())
    const intvl = setTimeout(() => setCacheBreak(Date.now()), 10000)
    return () => clearTimeout(intvl)
  }, [cacheBreak])
  const url = relayerURL
    ? `${relayerURL}/identity/${selectedAcc}/${selectedNetwork.id}/transactions?cacheBreak=${cacheBreak}`
    : null
  const { data, errMsg, isLoading } = useRelayerData(url)

  // @TODO implement a service that stores sent transactions locally that will be used in relayerless mode
  if (!relayerURL) return (<section id='transactions'>
    <h3 className='error'>Unsupported: not currently connected to a relayer.</h3>
  </section>)

  // @TODO: visualize other pending bundles
  const firstPending = data && data.txns.find(x => !x.executed && !x.replaced)

  const mapToBundle = (relayerBundle, extra = {}) => (new Bundle({
    ...relayerBundle,
    nonce: relayerBundle.nonce.num,
    gasLimit: null,
    ...extra
  }))
  const cancelByReplacing = relayerBundle => showSendTxns(mapToBundle(relayerBundle, { txns: [[selectedAcc, '0x0', '0x']] }))
  const cancel = relayerBundle => {
    // @TODO relayerless
    mapToBundle(relayerBundle).cancel({ relayerURL, fetch })
      .then(({ success }) => {
        if (!success) {
          addToast('Transaction already picked up by the network, you will need to pay a fee to replace it with a cancellation transaction.')
          cancelByReplacing(relayerBundle)
        } else {
          addToast('Transaction cancelled successfully')
        }
      })
      .catch(e => {
        console.error(e)
        cancelByReplacing(relayerBundle)
      })
  }

  // @TODO: we are currently assuming the last txn is a fee; change that (detect it)
  const speedup = relayerBundle => showSendTxns(mapToBundle(relayerBundle, { txns: relayerBundle.txns.slice(0, -1) }))

  return (
    <section id='transactions'>
      { !!firstPending && (<div className='panel'>
        <div className='title'><MdOutlinePendingActions/>Pending transaction bundle</div>
        <div className="content">
          <div className="bundle">
            <MinedBundle bundle={firstPending}></MinedBundle>
            <div className='actions'>
              <button onClick={() => cancel(firstPending)}>Cancel</button>
              <button className='cancel' onClick={() => speedup(firstPending)}>Speed up</button>
            </div>
          </div>
        </div>
      </div>) }

      <div id="confirmed" className="panel">
        <div className="title">
          <BsCheck2All/>
          {(data && data.txns.length === 0) ? 'No transactions yet.' : 'Confirmed transactions'}
        </div>
        <div className="content">
          {!relayerURL && (<h3 className='error'>Unsupported: not currently connected to a relayer.</h3>)}
          {errMsg && (<h3 className='error'>Error getting list of transactions: {errMsg}</h3>)}
          {(isLoading && !data) && <Loading />}
          {
              // @TODO respect the limit and implement pagination
              data && data.txns.filter(x => x.executed && x.executed.mined).map(bundle => MinedBundle({ bundle }))
          }
        </div>
      </div>
    </section>
  )
}

function MinedBundle({ bundle }) {
  const network = networks.find(x => x.id === bundle.network)
  if (!Array.isArray(bundle.txns)) return (<h3 className='error'>Bundle has no transactions (should never happen)</h3>)
  const lastTxn = bundle.txns[bundle.txns.length - 1]
  // terribly hacky; @TODO fix
  // all of the values are prob checksummed so we may not need toLowerCase
  const lastTxnSummary = getTransactionSummary(lastTxn, bundle.network, bundle.identity)
  const hasFeeMatch = lastTxnSummary.match(new RegExp(`to ${accountPresets.feeCollector}`, 'i'))
  const txns = hasFeeMatch ? bundle.txns.slice(0, -1) : bundle.txns
  const toLocaleDateTime = date => `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`

  return (<div className='minedBundle bundle' key={bundle._id}>
    {txns.map((txn, i) => (<TxnPreview
      key={i} // safe to do this, individual TxnPreviews won't change within a specific bundle
      txn={txn} network={bundle.network} account={bundle.identity}/>
    ))}
    <ul className="details">
      {
        hasFeeMatch ?
          <li>
            <label><BsCoin/>Fee</label>
            <p>{lastTxnSummary.slice(5, -hasFeeMatch[0].length)}</p>
          </li>
          :
          null
      }
      <li>
        <label><BsCalendarWeek/>Submitted on</label>
        <p>{bundle.submittedAt && (toLocaleDateTime(new Date(bundle.submittedAt))).toString()}</p>
      </li>
      {
        bundle.replacesTxId ?
          <li>
            <label>Replaces transaction</label>
            <p>{bundle.replacesTxId}</p>
          </li>
          :
          null
      }
      {
        bundle.txId ?
          <li>
            <label><BsGlobe2/>Block Explorer</label>
            <p><a href={network.explorerUrl+'/tx/'+bundle.txId} target='_blank' rel='noreferrer'>{network.explorerUrl.split('/')[2]}</a></p>
          </li>
          :
          null
      }
    </ul>
  </div>)
}

export default Transactions
