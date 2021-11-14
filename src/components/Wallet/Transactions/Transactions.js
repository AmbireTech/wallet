import './Transactions.scss'
import { FaSignature } from 'react-icons/fa'
import { useRelayerData } from '../../../hooks'
import TxnPreview from '../../common/TxnPreview/TxnPreview'
import { Loading } from '../../common'
import accountPresets from '../../../consts/accountPresets'

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
              txn={[req.txn.to, req.txn.value, req.txn.data]}/>
        ))}
      </div>)}
      { !!firstPending && (<div className='panel'>
        <div className='title'>Pending transaction bundle</div>
        {firstPending && (<MinedBundle bundle={firstPending}></MinedBundle>)}
      </div>) }
      <h2>Confirmed transactions</h2>
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
  const lastTxn = bundle.txns[bundle.txns.length - 1]
  // terribly hacky; @TODO fix
  // all of the values are prob checksummed so we may not need toLowerCase
  const hasFee = lastTxn[0].toLowerCase() === accountPresets.feeCollector.toLowerCase()
    || lastTxn[2].toLowerCase().includes(accountPresets.feeCollector.toLowerCase().slice(2))
  const txns = hasFee ? bundle.txns.slice(0, -1) : bundle.txns

  return (<div className='minedBundle' key={bundle._id}>
    {txns.map((txn, i) => (<TxnPreview
      key={i} // safe to do this, individual TxnPreviews won't change within a specific bundle
      txn={txn} network={bundle.network} account={bundle.identity}/>
    ))}
    {hasFee && (<div className='fee'><b>Fee:</b> </div>)}
    <div><b>Submitted at:</b> {bundle.submittedAt && (new Date(bundle.submittedAt)).toString()}</div>
  </div>)
}

export default Transactions
