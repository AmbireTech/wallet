import './Transactions.scss'
import { FaSignature } from 'react-icons/fa'
import { BsCoin, BsCalendarWeek, BsGlobe2, BsCheck2All } from 'react-icons/bs'
import { MdOutlinePendingActions } from 'react-icons/md'
import { useRelayerData } from 'hooks'
import TxnPreview from 'components/common/TxnPreview/TxnPreview'
import { Loading, Button } from 'components/common'
import accountPresets from 'consts/accountPresets'
import networks from 'consts/networks'
import { getTransactionSummary } from 'lib/humanReadableTransactions'
import { Bundle } from 'adex-protocol-eth'
import { useEffect, useState } from 'react'
import fetch from 'node-fetch'
import { useToasts } from 'hooks/toasts'
import { toBundleTxn } from 'lib/requestToBundleTxn'
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi'

// 10% in geth and most EVM chain RPCs
const RBF_THRESHOLD = 1.1

function Transactions ({ relayerURL, selectedAcc, selectedNetwork, showSendTxns, eligibleRequests }) {
  const { addToast } = useToasts()
  const [cacheBreak, setCacheBreak] = useState(() => Date.now())
  const [page, setPage] = useState(1)

  useEffect(() => setPage(1), [selectedAcc, selectedNetwork])

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
    <h3 className='validation-error'>Unsupported: not currently connected to a relayer.</h3>
  </section>)

  // @TODO: visualize other pending bundles
  const firstPending = data && data.txns.find(x => !x.executed && !x.replaced)

  const mapToBundle = (relayerBundle, extra = {}) => (new Bundle({
    ...relayerBundle,
    nonce: relayerBundle.nonce.num,
    gasLimit: null,
    // Instruct the relayer to abide by this minimum fee in USD per gas, to ensure we are truly replacing the txn
    minFeeInUSDPerGas: relayerBundle.feeInUSDPerGas * RBF_THRESHOLD,
    ...extra
  }))
  const cancelByReplacing = relayerBundle => showSendTxns(mapToBundle(relayerBundle, {
    txns: [[selectedAcc, '0x0', '0x']],
  }))
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

  const maxBundlePerPage = 10
  const executedTransactions = data ? data.txns.filter(x => x.executed) : []
  const bundlesList = executedTransactions.slice((page - 1) * maxBundlePerPage, page * maxBundlePerPage).map(bundle => BundlePreview({ bundle, mined: true }))
  const maxPages = Math.ceil(executedTransactions.length / maxBundlePerPage)

  const paginationControls = (
    <div className='pagination-controls'>
      <div className='pagination-title'>Page</div>
      <Button clear mini onClick={() => page > 1 && setPage(page => page - 1)}><HiOutlineChevronLeft/></Button>
      <div className='pagination-current'>{ page } <span>/ { maxPages }</span></div>
      <Button clear mini onClick={() => page < maxPages && setPage(page => page + 1)}><HiOutlineChevronRight/></Button>
    </div>
  )


  return (
    <section id='transactions'>
      {!!eligibleRequests.length && (<div className='panel'>
        <div className='title'><FaSignature size={25}/>Waiting to be signed (current batch)</div>
        <div className="content">
          <div className="bundle">
            <div onClick={() => showSendTxns(null)}>
              {eligibleRequests.map(req => (
                <TxnPreview
                    key={req.id}
                    network={selectedNetwork.id}
                    account={selectedAcc}
                    disableExpand={true}
                    txn={toBundleTxn(req.txn, selectedAcc)}/>
              ))}
            </div>
              <div className='actions'>
                {/*
                <Button small className='cancel' onClick={
                  () => resolveMany(eligibleRequests.map(x => x.id), { message: 'Ambire user rejected all requests' })
                }>Reject all</Button>*/}
                <Button small onClick={() => showSendTxns(null)}>Sign or reject</Button>
              </div>
          </div>
        </div>
      </div>)}
      { !!firstPending && (<div className='panel' id="pending">
        <div className='title'><MdOutlinePendingActions/>Pending transaction bundle</div>
        <div className="content">
          <div className="bundle">
            <BundlePreview bundle={firstPending}></BundlePreview>
            <div className='actions'>
              <Button small className='cancel' onClick={() => cancel(firstPending)}>Cancel</Button>
              <Button small onClick={() => speedup(firstPending)}>Speed up</Button>
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
          {!relayerURL && (<h3 className='validation-error'>Unsupported: not currently connected to a relayer.</h3>)}
          {errMsg && (<h3 className='validation-error'>Error getting list of transactions: {errMsg}</h3>)}
          {
            isLoading && !data ? <Loading /> :
              !bundlesList.length ? null :
                <>
                  { paginationControls }
                  { bundlesList }
                  { paginationControls }
                </>
          }
        </div>
      </div>
    </section>
  )
}

function BundlePreview({ bundle, mined = false }) {
  const network = networks.find(x => x.id === bundle.network)
  if (!Array.isArray(bundle.txns)) return (<h3 className='error'>Bundle has no transactions (should never happen)</h3>)
  const lastTxn = bundle.txns[bundle.txns.length - 1]
  // terribly hacky; @TODO fix
  // all of the values are prob checksummed so we may not need toLowerCase
  const lastTxnSummary = getTransactionSummary(lastTxn, bundle.network, bundle.identity)
  const hasFeeMatch = lastTxnSummary.match(new RegExp(`to ${accountPresets.feeCollector}`, 'i'))
  const txns = hasFeeMatch ? bundle.txns.slice(0, -1) : bundle.txns
  const toLocaleDateTime = date => `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`

  return (<div className='bundlePreview bundle' key={bundle._id}>
    {txns.map((txn, i) => (<TxnPreview
      key={i} // safe to do this, individual TxnPreviews won't change within a specific bundle
      txn={txn} network={bundle.network} account={bundle.identity} mined={mined} />
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
      {
        bundle.executed && !bundle.executed.success && (
          <li>
            <label>Error</label>
            <p>{bundle.executed.errorMsg || 'unknown error'}</p>
          </li>
        )
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
