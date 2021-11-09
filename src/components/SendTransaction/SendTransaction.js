//import { GrInspect } from 'react-icons/gr'
// GiObservatory is also interesting
import { GiTakeMyMoney, GiSpectacles } from 'react-icons/gi'
import { FaSignature, FaTimes } from 'react-icons/fa'
import { getTransactionSummary } from '../../lib/humanReadableTransactions'
import './SendTransaction.css'
import { Loading } from '../common'
import { useEffect, useState, useMemo } from 'react'

import fetch from 'node-fetch'
import { Bundle } from 'adex-protocol-eth/js'
import { getDefaultProvider } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { useToasts } from '../../hooks/toasts'
import { getWallet } from '../../lib/getWallet'
import accountPresets from '../../consts/accountPresets'
import { sendNoRelayer } from './noRelayer'

const ERC20 = new Interface(require('adex-protocol-eth/abi/ERC20'))

const SPEEDS = ['slow', 'medium', 'fast', 'ape']
const DEFAULT_SPEED = 'fast'
const ADDED_GAS_TOKEN = 20000
const ADDED_GAS_NATIVE = 10000
const REESTIMATE_INTERVAL = 15000

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

export default function SendTransaction({ accounts, network, selectedAcc, requests, resolveMany, relayerURL, onDismiss }) {
  const account = accounts.find(x => x.id === selectedAcc)

  // Also filtered in App.js, but better safe than sorry here
  const eligibleRequests = useMemo(() => requests
    .filter(({ type, chainId, account, txn }) =>
      type === 'eth_sendTransaction'
      && chainId === network.chainId
      && account === selectedAcc
      && txn && (!txn.from || txn.from.toLowerCase() === selectedAcc.toLowerCase())
    // we only need to update on change of IDs
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [requests.map(x => x.id).join(','), network.chainId, selectedAcc])
  const bundle = useMemo(
    () => makeBundle(account, network.id, eligibleRequests),
    [network.id, account, eligibleRequests]
  )

  if (!account || !eligibleRequests.length) return (<div id="sendTransaction">
      <h3 className="error">No account or no requests: should never happen.</h3>
  </div>)
  return SendTransactionWithBundle({ bundle, network, account, resolveMany, relayerURL, onDismiss })
}

function SendTransactionWithBundle ({ bundle, network, account, resolveMany, relayerURL, onDismiss }) {
  const [estimation, setEstimation] = useState(null)
  const [signingInProgress, setSigningInProgress] = useState(false)
  const [feeSpeed, setFeeSpeed] = useState(DEFAULT_SPEED)
  const { addToast } = useToasts()

  const { nativeAssetSymbol } = network

  useEffect(() => {
    if (!bundle.txns.length) return
    setEstimation(null)
  }, [bundle, setEstimation])
  useEffect(() => {    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (!bundle.txns.length) return

    let unmounted = false

    // get latest estimation
    const reestimate = () => (relayerURL
      ? bundle.estimate({ relayerURL, fetch })
      : bundle.estimateNoRelayer({ provider: getDefaultProvider(network.rpc) })
    )
      .then(estimation => {
        if (unmounted) return
        estimation.selectedFeeToken = { symbol: network.nativeAssetSymbol }
        if (estimation.remainingFeeTokenBalances) {
          const eligibleToken = estimation.remainingFeeTokenBalances
            .find(token => isTokenEligible(token, feeSpeed, estimation))
          // If there's no eligibleToken, set it to the first one cause it looks more user friendly (it's the preferred one, usually a stablecoin)
          estimation.selectedFeeToken = eligibleToken || estimation.remainingFeeTokenBalances[0]
        }
        setEstimation(estimation)
      })
      .catch(e => {
        if (unmounted) return
        console.log('estimation error', e)
        addToast(`Estimation error: ${e.message || e}`, { error: true })
      })

    reestimate()
    const intvl = setInterval(reestimate, REESTIMATE_INTERVAL)

    return () => {
      unmounted = true
      clearInterval(intvl)
    }
  }, [bundle, setEstimation, feeSpeed, addToast, network, relayerURL])

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
            &nbsp;<a href={explorerUrl+'/tx/'+bundleResult.txId} target='_blank' rel='noreferrer'>View on block explorer.</a>
          </span>))
        else addToast(`Transaction error: ${bundleResult.message || 'unspecified error'}`, { error: true })
        onDismiss()
      })
      .catch(e => {
        console.error(e)
        if (e && e.message.includes('must provide an Ethereum address')) {
          addToast(`Signing error: not connected with the correct address. Make sure you're connected with ${bundle.signer.address}.`, { error: true })
        } else addToast(`Signing error: ${e.message || e}`, { error: true })
      })
      .then(() => setSigningInProgress(false))

  }

  const rejectTxn = () => {
    resolveMany(bundle.requestIds, { message: 'rejected' })
  }

  return (<div id="sendTransaction">
      <div className="dismiss" onClick={onDismiss}><FaTimes size={35}/></div>
      <h2>Pending transactions: {bundle.txns.length}</h2>
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
                              <li key={bundle.requestIds[i]} className={isFirstFailing ? 'firstFailing' : ''}>
                                  {getTransactionSummary(txn, bundle.network)}
                                  {isFirstFailing ? (<div><b>This is the first failing transaction.</b></div>) : (<></>)}
                                  <button onClick={() => resolveMany([bundle.requestIds[i]], { message: 'rejected' })}><FaTimes/></button>
                              </li>
                          )})}
                      </ul>
                      <span>
                          <b>NOTE:</b> Transaction batching is enabled, you're signing {bundle.txns.length} transactions at once. You can add more transactions to this batch by interacting with a connected dApp right now.
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
                            feeSpeed={feeSpeed}
                            setFeeSpeed={setFeeSpeed}
                          ></FeeSelector>
                  </div>
              </div>
              <div className="panel actions">
                  <div className="heading">
                      <div className="title">
                          <FaSignature size={35}/>
                          Sign
                      </div>
                  </div>
                  <Actions
                    estimation={estimation}
                    approveTxn={approveTxn} rejectTxn={rejectTxn}
                    signingInProgress={signingInProgress}
                    feeSpeed={feeSpeed}
                  />
              </div>
          </div>
      </div>
  </div>)
}

function Actions({ estimation, feeSpeed, approveTxn, rejectTxn, signingInProgress }) {
  const rejectButton = (
    <button className='rejectTxn' onClick={rejectTxn}>Reject</button>
  )
  const insufficientFee = estimation && estimation.feeInUSD
    && !isTokenEligible(estimation.selectedFeeToken, feeSpeed, estimation)
  const willFail = (estimation && !estimation.success) || insufficientFee
  if (willFail) {
    return (<>
      <h2 className='error'>
        {insufficientFee ?
          `Insufficient balance for the fee. Accepted tokens: ${estimation.remainingFeeTokenBalances.map(x => x.symbol).join(', ')}`
          : `The current transaction batch cannot be broadcasted because it will fail: ${estimation.message}`
        }
      </h2>
      {rejectButton}
    </>)
  }

  return (<div>
      {rejectButton}
      <button className='approveTxn' disabled={!estimation || signingInProgress} onClick={approveTxn}>
        {signingInProgress ? (<><Loading/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Signing...</>) : (<>Sign and send</>)}
      </button>
  </div>)
}

function FeeSelector ({ signer, estimation, network, setEstimation, feeSpeed, setFeeSpeed }) {
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
    setEstimation({ ...estimation, selectedFeeToken: token })
  }
  const feeCurrencySelect = estimation.feeInUSD ? (<>
    <span style={{ marginTop: '1em' }}>Fee currency</span>
    <select defaultValue={estimation.selectedFeeToken.symbol} onChange={onFeeCurrencyChange}>
      {tokens.map(token => 
        (<option
          disabled={!isTokenEligible(token, feeSpeed, estimation)}
          key={token.symbol}>
            {token.symbol}
          </option>
        )
      )}
    </select>
  </>) : (<></>)

  const { isStable } = estimation.selectedFeeToken
  const { multiplier } = getFeePaymentConsequences(estimation.selectedFeeToken, estimation)
  const feeAmountSelectors = SPEEDS.map(speed => (
    <div 
      key={speed}
      className={feeSpeed === speed ? 'feeSquare selected' : 'feeSquare'}
      onClick={() => setFeeSpeed(speed)}
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
function isTokenEligible (token, speed, estimation) {
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