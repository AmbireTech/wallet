import './Transactions.scss'

import { useRelayerData } from '../../../hooks'
import TxnPreview from '../../common/TxnPreview/TxnPreview'
import { Loading } from '../../common'
import accountPresets from '../../../consts/accountPresets'

function Transactions ({ relayerURL, selectedAcc, selectedNetwork }) {
  const { data, errMsg, isLoading } = useRelayerData(relayerURL ? `${relayerURL}/identity/${selectedAcc}/${selectedNetwork.id}/transactions` : null)

  // @TODO implement a service that stores sent transactions locally that will be used in relayerless mode
  if (!relayerURL) return (<section id='transactions'>
    <h3 className='error'>Unsupported: not currently connected to a relayer.</h3>
  </section>)

  return (
    <section id='transactions'>
      <h3>Mined transactions</h3>
      {!relayerURL && (<h3 className='error'>Unsupported: not currently connected to a relayer.</h3>)}
      {errMsg && (<h3 className='error'>Error getting mined transactions: {errMsg}</h3>)}
      {isLoading && <Loading />}
      {
          // @TODO respect the limit and implement pagination
          !isLoading && data && data.txns.map(MinedBundle)
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
      txn={txn} bundle={bundle}/>
    ))}
    {hasFee && (<div className='fee'>Fee: </div>)}
    <div>Submitted at: {bundle.submittedAt}</div>
  </div>)
}

export default Transactions
