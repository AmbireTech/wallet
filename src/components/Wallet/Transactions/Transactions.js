import { useRelayerData } from '../../../hooks'
import TxnPreview from '../../common/TxnPreview/TxnPreview'
import { Loading } from '../../common'

function Transactions ({ relayerURL, selectedAcc, selectedNetwork }) {
  const { data, errMsg, isLoading } = useRelayerData(relayerURL ? `${relayerURL}/identity/${selectedAcc}/${selectedNetwork.id}/transactions` : null)

  // @TODO implement a service that stores sent transactions locally that will be used in relayerless mode
  if (!relayerURL) return (<section id='transactions'>
    <h3 className='error'>Unsupported: not currently connected to a relayer.</h3>
  </section>)

  return (
    <section id='transactions'>
      <div className='panel'>
        <div className='title'>Mined transactions</div>
        {!relayerURL && (<h3 className='error'>Unsupported: not currently connected to a relayer.</h3>)}
        {errMsg && (<h3 className='error'>Error getting mined transactions: {errMsg}</h3>)}
        {isLoading && <Loading />}
        {
            // @TODO respect the limit and implement pagination
            !isLoading && data && data.txns.map(bundle => (<div className='panel' key={bundle._id}>
                {bundle.txns.map((txn, i) => (<TxnPreview
                    key={i} // safe to do this, individual TxnPreviews won't change within a specific bundle
                    txn={txn} bundle={bundle}/>
                ))}
            </div>))
        }
      </div>
    </section>
  )
}

export default Transactions
