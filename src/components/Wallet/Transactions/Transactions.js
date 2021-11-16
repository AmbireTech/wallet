import './Transactions.scss'
import { FaSignature } from 'react-icons/fa'
import { useRelayerData } from '../../../hooks'
import TxnPreview from '../../common/TxnPreview/TxnPreview'
import { Loading } from '../../common'
import accountPresets from '../../../consts/accountPresets'
import networks from '../../../consts/networks'
import { getTransactionSummary } from '../../../lib/humanReadableTransactions'

function Transactions ({ relayerURL, selectedAcc, selectedNetwork, eligibleRequests, showSendTxns }) {
  // @TODO refresh this after we submit a bundle; perhaps with the service
  // we can just append a cache break to the URL - that way we force the hook to refresh, and we have a cachebreak just in case
  const url = relayerURL
    ? `${relayerURL}/identity/${selectedAcc}/${selectedNetwork.id}/transactions`
    : null
  const { data, errMsg, isLoading } = useRelayerData(url)

  // @TODO implement a service that stores sent transactions locally that will be used in relayerless mode
  if (!relayerURL) return (<section id='transactions'>
    <h3 className='error'>Unsupported: not currently connected to a relayer.</h3>
  </section>)

  // @TODO: visualize others
  const firstPending = data && data.txns.find(x => !x.executed)

  return (
    <section id='transactions'>
      {!!eligibleRequests.length && (<div onClick={showSendTxns} className='panel'>
        <div className='title'><FaSignature size={25}/>&nbsp;&nbsp;&nbsp;Waiting to be signed</div>
        {eligibleRequests.map(req => (
          <TxnPreview
              key={req.id}
              network={selectedNetwork.id}
              account={selectedAcc}
              txn={[req.txn.to, req.txn.value || '0x0', req.txn.data || '0x' ]}/>
        ))}
      </div>)}
      { !!firstPending && (<div className='panel'>
        <div className='title'>Pending transaction bundle</div>
        {firstPending && (<MinedBundle bundle={firstPending}></MinedBundle>)}
      </div>) }

      <h2>{(data && data.txns.length === 0) ? 'No transactions yet.' : 'Confirmed transactions'}</h2>
      {!relayerURL && (<h3 className='error'>Unsupported: not currently connected to a relayer.</h3>)}
      {errMsg && (<h3 className='error'>Error getting list of transactions: {errMsg}</h3>)}
      {isLoading && <Loading />}
      {
          // @TODO respect the limit and implement pagination
          !isLoading && data && data.txns.filter(x => x.executed && x.executed.mined).map(MinedBundle)
      }
    </section>
  )
}

function MinedBundle(bundle) {
  const network = networks.find(x => x.id === bundle.network)
  if (!Array.isArray(bundle.txns)) return (<h3 className='error'>Bundle has no transactions (should never happen)</h3>)
  const lastTxn = bundle.txns[bundle.txns.length - 1]
  // terribly hacky; @TODO fix
  // all of the values are prob checksummed so we may not need toLowerCase
  const lastTxnSummary = getTransactionSummary(lastTxn, bundle.network, bundle.account)
  const hasFeeMatch = lastTxnSummary.match(new RegExp(`to ${accountPresets.feeCollector}`, 'i'))
  const txns = hasFeeMatch ? bundle.txns.slice(0, -1) : bundle.txns

  return (<div className='minedBundle' key={bundle._id}>
    {txns.map((txn, i) => (<TxnPreview
      key={i} // safe to do this, individual TxnPreviews won't change within a specific bundle
      txn={txn} network={bundle.network} account={bundle.identity}/>
    ))}
    {hasFeeMatch && (<div className='fee'><b>Fee:</b> {lastTxnSummary.slice(5, -hasFeeMatch[0].length)}</div>)}
    <div><b>Submitted at:</b> {bundle.submittedAt && (new Date(bundle.submittedAt)).toString()}</div>
    { bundle.txId && (<div
      ><b>Block explorer:</b> <a href={network.explorerUrl+'/tx/'+bundle.txId} target='_blank' rel='noreferrer'>{network.explorerUrl.split('/')[2]}</a>
    </div>) }

  </div>)
}

export default Transactions
