//import { GrInspect } from 'react-icons/gr'
// GiObservatory is also interesting
import { GiTakeMyMoney, GiSpectacles } from 'react-icons/gi'
import { FaSignature, FaTimes } from 'react-icons/fa'
import { getTransactionSummary, getBundleShortSummary } from '../../lib/humanReadableTransactions'
import './SendTransaction.css'
import { Loading } from '../common'
import { useEffect, useState } from 'react'

import fetch from 'node-fetch'
import { Bundle } from 'adex-protocol-eth/js'
import { getDefaultProvider } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { useHistory } from 'react-router'
import { useToasts } from '../../hooks/toasts'
import { getWallet } from '../../lib/getWallet'
import accountPresets from '../../consts/accountPresets'
import { sendNoRelayer } from './noRelayer'

const ERC20 = new Interface(require('adex-protocol-eth/abi/ERC20'))

const SPEEDS = ['slow', 'medium', 'fast', 'ape']
const DEFAULT_SPEED = 'fast'
const ADDED_GAS_TOKEN = 20000
const ADDED_GAS_NATIVE = 10000

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
  const [estimation, setEstimation] = useState(null)
  const [signingInProgress, setSigningInProgress] = useState(false)
  const history = useHistory()
  const { addToast } = useToasts()

  const { nativeAssetSymbol } = network
  // Also filtered in App.js, but better safe than sorry here
  const eligibleRequests = requests
    .filter(({ type, chainId, account, txn }) =>
      type === 'eth_sendTransaction'
      && chainId === network.chainId
      && account === selectedAcc
      && txn && (!txn.from || txn.from.toLowerCase() === selectedAcc.toLowerCase())
    )
  useEffect(() => {
    setEstimation(null)
    if (!eligibleRequests.length) return
    // Notify the user with the latest bundle
    notifyUser(bundle)

    // get latest estimation
    const estimatePromise = relayerURL
      ? bundle.estimate({ relayerURL, fetch })
      : bundle.estimateNoRelayer({ provider: getDefaultProvider(network.rpc) })
    estimatePromise
      .then(estimation => {
        estimation.selectedFee = {
          speed: DEFAULT_SPEED,
          token: { symbol: nativeAssetSymbol }
        }
        if (estimation.remainingFeeTokenBalances) {
          const eligibleToken = estimation.remainingFeeTokenBalances
            .find(token => isTokenEligible(token, estimation))
          // If there's no eligibleToken, set it to the first one cause it looks more user friendly (it's the preferred one, usually a stablecoin)
          estimation.selectedFee.token = eligibleToken || estimation.remainingFeeTokenBalances[0]
        }
        setEstimation(estimation)
      })
      .catch(e => {
        addToast(`Estimation error: ${e.message || e}`, { error: true })
        console.log('estimation error', e)
      })
    }, [eligibleRequests.length, setEstimation, addToast, nativeAssetSymbol, network.rpc, relayerURL])

  if (!selectedAcc) return (<h3 className='error'>No selected account</h3>)

  const account = accounts.find(x => x.id === selectedAcc)
  if (!account) throw new Error('internal: account does not exist')

  const bundle = makeBundle(account, network.id, eligibleRequests)

  const approveTxnImpl = async () => {
    if (!estimation) return

    const requestIds = bundle.requestIds
    const { token: feeToken, speed } = estimation.selectedFee
    const { addedGas, multiplier } = getFeePaymentConsequences(feeToken, estimation)
    const toHexAmount = amnt => '0x'+Math.round(amnt).toString(16)
    const feeTxn = feeToken.symbol === nativeAssetSymbol 
      ? [accountPresets.feeCollector, toHexAmount(estimation.feeInNative[speed]*multiplier*1e18), '0x']
      : [feeToken.address, '0x0', ERC20.encodeFunctionData('transfer', [
        accountPresets.feeCollector,
        toHexAmount(
          (feeToken.isStable ? estimation.feeInUSD[speed] : estimation.feeInNative[speed])
          * multiplier
          * Math.pow(10, feeToken.decimals)
        )
    ])]
    const finalBundle = new Bundle({
      ...bundle,
      txns: relayerURL ? [...bundle.txns, feeTxn] : [...bundle.txns]
    })

    const provider = getDefaultProvider(network.rpc)
    const signer = finalBundle.signer
    const wallet = getWallet({
      signer,
      signerExtra: account.signerExtra,
      chainId: network.chainId
    })
    if (relayerURL) {
      finalBundle.gasLimit = estimation.gasLimit + addedGas

      await finalBundle.getNonce(provider)
      await finalBundle.sign(wallet)
      const bundleResult = await finalBundle.submit({ relayerURL, fetch })
      resolveMany(requestIds, { success: bundleResult.success, result: bundleResult.txId, message: bundleResult.message })
      return bundleResult
    } else {
      const result = await sendNoRelayer({ finalBundle, account, wallet, estimation, provider, nativeAssetSymbol })
      resolveMany(requestIds, { success: true, result: result.txId })
      return result
    }
  }

  const approveTxn = () => {
    if (signingInProgress) return
    setSigningInProgress(true)

    const explorerUrl = network.explorerUrl
    approveTxnImpl()
      .then(bundleResult => {
        if (bundleResult.success) addToast((
          <span>Transaction signed and sent successfully!
            &nbsp;View on block explorer.
          </span>), { url: explorerUrl+'/tx/'+bundleResult.txId })
        else addToast(`Transaction error: ${bundleResult.message || 'unspecified error'}`, { error: true })

        history.goBack()
      })
      .catch(e => {
        console.error(e)
        if (e && e.message.includes('must provide an Ethereum address')) {
          addToast(`Signing error: not connected with the correct address. Make sure you're connected with ${bundle.signer.address}.`, { error: true })
        } else addToast(`Signing error: ${e.message || e}`, { error: true })
      })
      .then(() => setSigningInProgress(false))

  }

  const rejectButton = (
      <button className='rejectTxn' onClick={() => {
          resolveMany(requests.map(x => x.id), { message: 'rejected' })
          history.goBack()
      }}>Reject</button>
  )

  const insufficientFee = estimation && estimation.feeInUSD && !isTokenEligible(estimation.selectedFee.token, estimation)
  const willFail = (estimation && !estimation.success) || insufficientFee
  const actionable =
      willFail
      ? (<>
          <h2 className='error'>
            {insufficientFee ?
              `Insufficient balance for the fee. Accepted tokens: ${estimation.remainingFeeTokenBalances.map(x => x.symbol).join(', ')}`
              : `The current transaction cannot be broadcasted because it will fail: ${estimation.message}`
            }
          </h2>
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
                          {bundle.txns.map((txn, i) => {
                            const isFirstFailing = estimation && !estimation.success && estimation.firstFailing === i
                            return (
                              <li key={txn} className={isFirstFailing ? 'firstFailing' : ''}>
                                  {getTransactionSummary(txn, bundle)}
                                  {isFirstFailing ? (<div><b>This is the first failing transaction.</b></div>) : (<></>)}
                                  <a onClick={() => resolveMany([eligibleRequests[i].id], { message: 'rejected' })}><FaTimes></FaTimes></a>
                              </li>
                          )})}
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
                          <FeeSelector
                            signer={bundle.signer}
                            estimation={estimation}
                            setEstimation={setEstimation}
                            network={network}
                          ></FeeSelector>
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

function FeeSelector ({ signer, estimation, network, setEstimation }) {
  if (!estimation) return (<Loading/>)
  if (!estimation.feeInNative) return (<></>)
  if (estimation && !estimation.feeInUSD && estimation.gasLimit < 40000) {
    return (<div>
      <b>WARNING:</b> Fee estimation unavailable when you're doing your first account transaction and you are not connected to a relayer. You will pay the fee from <b>{signer.address}</b>, make sure you have {network.nativeAssetSymbol} there.
    </div>)
  }

  const { nativeAssetSymbol } = network
  const tokens = estimation.remainingFeeTokenBalances || ({ symbol: nativeAssetSymbol, decimals: 18 })
  const onFeeCurrencyChange = e => {
    const token = tokens.find(({ symbol }) => symbol === e.target.value)
    setEstimation({ ...estimation, selectedFee: { ...estimation.selectedFee, token } })
  }
  const feeCurrencySelect = estimation.feeInUSD ? (<>
    <span style={{ marginTop: '1em' }}>Fee currency</span>
    <select defaultValue={estimation.selectedFee.token.symbol} onChange={onFeeCurrencyChange}>
      {tokens.map(token => 
        (<option
          disabled={!isTokenEligible(token, estimation)}
          key={token.symbol}>
            {token.symbol}
          </option>
        )
      )}
    </select>
  </>) : (<></>)

  const { isStable } = estimation.selectedFee.token
  const { multiplier } = getFeePaymentConsequences(estimation.selectedFee.token, estimation)
  const feeAmountSelectors = SPEEDS.map(speed => (
    <div 
      key={speed}
      className={estimation.selectedFee.speed === speed ? 'feeSquare selected' : 'feeSquare'}
      onClick={() => setEstimation({ ...estimation, selectedFee: { ...estimation.selectedFee, speed } })}
    >
      <div className='speed'>{speed}</div>
      {isStable
        ? '$'+(estimation.feeInUSD[speed] * multiplier)
        : (estimation.feeInNative[speed] * multiplier)+' '+nativeAssetSymbol
      }
    </div>
  ))

  return (<>
    {feeCurrencySelect}
    <div className='feeAmountSelectors'>
      {feeAmountSelectors}
    </div>
    {!estimation.feeInUSD ?
      (<span><b>WARNING:</b> Paying fees in tokens other than {nativeAssetSymbol} is unavailable because you are not connected to a relayer. You will pay the fee from <b>{signer.address}</b>.</span>)
      : (<></>)}
  </>)
}

// helpers
function isTokenEligible (token, estimation) {
  const speed = estimation.selectedFee.speed || DEFAULT_SPEED
  const min = token.isStable ? estimation.feeInUSD[speed] : estimation.feeInNative[speed]
  return parseInt(token.balance) / Math.pow(10, token.decimals) > min
}

// can't think of a less funny name for that
function getFeePaymentConsequences (token, estimation) {
  // Relayerless mode
  if (!estimation.feeInUSD) return { multiplier: 1, addedGas: 0 }
  // Relayer mode
  const addedGas = !token.address || token.address === '0x0000000000000000000000000000000000000000'
    ? ADDED_GAS_NATIVE
    : ADDED_GAS_TOKEN
 return {
   multiplier: (estimation.gasLimit + addedGas) / estimation.gasLimit,
   addedGas
 }
}