//import { GrInspect } from 'react-icons/gr'
// GiObservatory is also interesting
import { GiTakeMyMoney, GiSpectacles } from 'react-icons/gi'
import { FaSignature } from 'react-icons/fa'
import { getTransactionSummary, getBundleShortSummary } from '../../lib/humanReadableTransactions'
import './SendTransaction.css'
import { Loading } from '../common'
import { useEffect, useState } from 'react'

// @TODO get rid of these, should be in the SignTransaction component
import fetch from 'node-fetch'
import { Bundle } from 'adex-protocol-eth/js'
import { getDefaultProvider } from 'ethers'
import { useHistory } from 'react-router'
import { useToasts } from '../../hooks/toasts'
import { getWallet } from '../../lib/getWallet'

const SPEEDS = ['slow', 'medium', 'fast', 'ape']

function notifyUser (bundle) {
  if (window.Notification && Notification.permission !== 'denied') {
    Notification.requestPermission(status => {  // status is "granted", if accepted by user
      if (status !== 'granted') return
       /*var n = */new Notification('Ambire Wallet: new transaction request', {
        body: `${getBundleShortSummary(bundle)}`,
        requireInteraction: true
        //icon: '/path/to/icon.png' // optional
      })
    })
  }
}

function toBundleTxn({ to, value, data }) {
  return [to, value || '0x0', data || '0x']
}

function makeBundle(account, networkId, requests) {
  const bundle = new Bundle({
    network: networkId,
    identity: account.id,
    txns: requests.map(({ txn }) => toBundleTxn(txn)),
    signer: account.signer
  })
  bundle.requestIds = requests.map(x => x.id)
  return bundle
}

export default function SendTransaction ({ accounts, network, selectedAcc, requests, resolveMany, relayerURL }) {
  const [frozenBundle, setFrozenBundle] = useState(null)
  const [estimation, setEstimation] = useState(null)
  const [signingInProgress, setSigningInProgress] = useState(false)
  const history = useHistory()
  const { addToast } = useToasts()

  // Also filtered in App.js, but better safe than sorry here
  const eligibleRequests = requests
    .filter(({ type, chainId, account, txn }) =>
      type === 'eth_sendTransaction'
      && chainId === network.chainId
      && account === selectedAcc
      && txn && (!txn.from || txn.from.toLowerCase() === selectedAcc.toLowerCase())
    )
  useEffect(() => {
    if (estimation) setEstimation(null)
    if (!eligibleRequests.length) return
    // Notify the user with the latest bundle
    notifyUser(bundle)

    // get latest estimation
    const estimatePromise = relayerURL
      ? bundle.estimate({ relayerURL, fetch })
      : bundle.estimateNoRelayer({ provider: getDefaultProvider(network.rpc) })
    estimatePromise
      .then(estimation => {
        if (!estimation.success) throw estimation
        else setEstimation(estimation)
      })
      .catch(e => {
        addToast(`Estimation error: ${e.message || e}`, { error: true })
        console.log('estimation error', e)
      })
    }, [eligibleRequests.length])

  if (!selectedAcc) return (<h3 className='error'>No selected account</h3>)

  const account = accounts.find(x => x.id === selectedAcc)
  if (!account) throw new Error('internal: account does not exist')

  // @TODO Add a fixed premium on gasLimit depending on how we pay the fee, to account for the costs of paying the fee itself
  const bundle = frozenBundle || makeBundle(account, network.id, eligibleRequests)
  // @TODO if we have a frozen bundle, ensure it is for the selected account

  const approveTxnImpl = async () => {
    if (!estimation) return
    // pay a fee to the relayer
    // @TODO clone the bundle here to avoid weird state mutations
    bundle.txns.push(['0x942f9CE5D9a33a82F88D233AEb3292E680230348', Math.round(estimation.feeInNative.fast*1e18).toString(10), '0x'])

    const provider = getDefaultProvider(network.rpc)
    await bundle.getNonce(provider)

    bundle.gasLimit = estimation.gasLimit

    const wallet = getWallet({ signer: bundle.signer, signerExtra: account.signerExtra })
    await bundle.sign(wallet)
    const bundleResult = await bundle.submit({ relayerURL, fetch })
    resolveMany(bundle.requestIds, { success: bundleResult.success, result: bundleResult.txId, message: bundleResult.message })
    // @TODO show a success toast with a URL to a block scanner
    return bundleResult
  }
  const approveTxn = () => {
    if (signingInProgress) return
    setSigningInProgress(true)

    const explorerUrl = network.explorerUrl
    approveTxnImpl()
      .then(bundleResult => {
        if (bundleResult.success) addToast((
          <span>Transaction signed and sent successfully!
            &nbsp;<a href={explorerUrl+'/tx/'+bundleResult.txId} target="_blank">View on block explorer.</a>
          </span>))
        else addToast(`Transaction error: ${bundleResult.message}`, { error: true })

        history.goBack()
      })
      .catch(e => {
        console.error(e)
        addToast(`Signing error: ${e.message || e}`, { error: true })
      })
      .then(() => setSigningInProgress(false))

  }

  const rejectButton = (
      <button className='rejectTxn' onClick={() => {
          resolveMany(requests.map(x => x.id), { message: 'rejected' })
          history.goBack()
      }}>Reject</button>
  )

  const actionable =
      (estimation && !estimation.success)
      ? (<>
          <h2 className='error'> The current transaction cannot be broadcasted because it will fail: {estimation.message}</h2>
          {rejectButton}
          </>)
      : (<div>
          {rejectButton}
          <button className='approveTxn' disabled={!estimation || signingInProgress} onClick={approveTxn}>
            {signingInProgress ? (<><Loading/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Signing...</>) : (<>Sign and send</>)}
          </button>
      </div>)

  return (<div id="sendTransaction">
      <h2>Pending transaction</h2>
      <div className="panelHolder">
          <div className="panel">
              <div className="heading">
                      <div className="title">
                          <GiSpectacles size={35}/>
                          Transaction summary
                      </div>
                      <ul>
                          {bundle.txns.map(txn => (
                              <li key={txn}>
                                  {getTransactionSummary(txn, bundle)}
                              </li>
                          ))}
                      </ul>
                      <span>
                          <b>NOTE:</b> Transaction batching is enabled, you're signing {eligibleRequests.length} transactions at once. You can add more transactions to this batch by interacting with a connected dApp right now.
                      </span>
              </div>
          </div>
          <div className="secondaryPanel">
              <div className="panel feePanel">
                  <div className="heading">
                          <div className="title">
                              <GiTakeMyMoney size={35}/>
                              Fee
                          </div>
                          <FeeSelector feeMultiplier={estimation ? (estimation.gasLimit+30000)/estimation.gasLimit : 1} estimation={estimation} network={network}></FeeSelector>
                  </div>
              </div>
              <div className="panel">
                  <div className="heading">
                      <div className="title">
                          <FaSignature size={35}/>
                          Sign
                      </div>
                  </div>
                  {actionable}
              </div>
          </div>
      </div>
  </div>)
}

function FeeSelector ({ estimation, feeMultiplier = 1, network, chosenSpeed = 'fast' }) {
  if (!estimation) return (<Loading/>)
  if (!estimation.feeInNative) return
  const { nativeAssetSymbol } = network
  const feeCurrencySelect = estimation.feeInUSD ? (
    <select defaultValue="USDT">
      <option>USDT</option>
      <option>USDC</option>
    </select>
  ) : (<select disabled defaultValue={nativeAssetSymbol}>
    <option>{nativeAssetSymbol}</option>
  </select>)

  const feeAmountSelectors = SPEEDS.map(speed => (
    <div key={speed} className={chosenSpeed === speed ? 'feeSquare selected' : 'feeSquare'}>
      <div className='speed'>{speed}</div>
      {estimation.feeInUSD
        ? '$'+(estimation.feeInUSD[speed] * feeMultiplier)
        : (estimation.feeInNative[speed] * feeMultiplier)+' '+nativeAssetSymbol
      }
    </div>
  ))

  return (<>
    <span style={{ marginTop: '1em' }}>Fee currency</span>
    {feeCurrencySelect}
    <div className='feeAmountSelectors'>
      {feeAmountSelectors}
    </div>
    {!estimation.feeInUSD ? (<span><b>WARNING:</b> Paying fees in tokens other than {nativeAssetSymbol} is unavailable because you are not connected to a relayer.</span>) : (<></>)}
  </>)
}