//import { GrInspect } from 'react-icons/gr'
// GiObservatory is also interesting
import { GiTakeMyMoney, GiSpectacles } from 'react-icons/gi'
import { FaSignature, FaTimes, FaChevronLeft, FaChevronDown, FaChevronUp } from 'react-icons/fa'
import { getContractName, getTransactionSummary } from '../../lib/humanReadableTransactions'
import './SendTransaction.css'
import { Loading } from '../common'
import { useEffect, useRef, useState, useMemo } from 'react'
import fetch from 'node-fetch'
import { Bundle } from 'adex-protocol-eth/js'
import { getDefaultProvider, Wallet } from 'ethers'
import { Interface, formatUnits } from 'ethers/lib/utils'
import { useToasts } from '../../hooks/toasts'
import { getWallet } from '../../lib/getWallet'
import accountPresets from '../../consts/accountPresets'
import { FeeSelector, FailingTxn } from './FeeSelector'
import { sendNoRelayer } from './noRelayer'
import { isTokenEligible, getFeePaymentConsequences } from './helpers'
import { fetchPost } from '../../lib/fetch'

const ERC20 = new Interface(require('adex-protocol-eth/abi/ERC20'))

const DEFAULT_SPEED = 'fast'
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

  if (!account || !eligibleRequests.length) return (<div id='sendTransaction'>
      <h3 className='error'>No account or no requests: should never happen.</h3>
  </div>)
  return (<SendTransactionWithBundle
      bundle={bundle}
      network={network}
      account={account}
      resolveMany={resolveMany}
      relayerURL={relayerURL}
      onDismiss={onDismiss}
  />)
}

function SendTransactionWithBundle ({ bundle, network, account, resolveMany, relayerURL, onDismiss }) {
  const [estimation, setEstimation] = useState(null)
  const [signingStatus, setSigningStatus] = useState(false)
  const [feeSpeed, setFeeSpeed] = useState(DEFAULT_SPEED)
  const { addToast } = useToasts()
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


  const { nativeAssetSymbol } = network

  const getFinalBundle = () => {
    if (!relayerURL) return new Bundle({
      ...bundle,
      gasLimit: estimation.gasLimit
    })

    const feeToken = estimation.selectedFeeToken
    const { addedGas, multiplier } = getFeePaymentConsequences(feeToken, estimation)
    const toHexAmount = amnt => '0x'+Math.round(amnt).toString(16)
    const feeTxn = feeToken.symbol === nativeAssetSymbol 
      ? [accountPresets.feeCollector, toHexAmount(estimation.feeInNative[feeSpeed]*multiplier*1e18), '0x']
      : [feeToken.address, '0x0', ERC20.encodeFunctionData('transfer', [
        accountPresets.feeCollector,
        toHexAmount(
          (feeToken.isStable ? estimation.feeInUSD[feeSpeed] : estimation.feeInNative[feeSpeed])
          * multiplier
          * Math.pow(10, feeToken.decimals)
        )
    ])]
    return new Bundle({
      ...bundle,
      txns: [...bundle.txns, feeTxn],
      gasLimit: estimation.gasLimit + addedGas
    })
  }

  const approveTxnImpl = async () => {
    if (!estimation) throw new Error('no estimation: should never happen')

    const finalBundle = getFinalBundle()
    const provider = getDefaultProvider(network.rpc)
    const signer = finalBundle.signer

    const wallet = getWallet({
      signer,
      signerExtra: account.signerExtra,
      chainId: network.chainId
    })
    if (relayerURL) {
      await finalBundle.getNonce(provider)
      await finalBundle.sign(wallet)
      return await finalBundle.submit({ relayerURL, fetch })
    } else {
      return await sendNoRelayer({
        finalBundle, account, network, wallet, estimation, feeSpeed, provider, nativeAssetSymbol
      })
    }
  }

  const approveTxnImplQuickAcc = async ({ quickAccCredentials }) => {
    if (!estimation) throw new Error('no estimation: should never happen')
    if (!relayerURL) throw new Error('Email/passphrase account signing without the relayer is not supported yet')

    const finalBundle = signingStatus.finalBundle || getFinalBundle()
    const signer = finalBundle.signer

    if (typeof finalBundle.nonce !== 'number') {
      await finalBundle.getNonce(getDefaultProvider(network.rpc))
    }

    const { signature, success, message, confCodeRequired } = await fetchPost(
      `${relayerURL}/second-key/${bundle.identity}/${network.id}/sign`, {
        signer, txns: finalBundle.txns, nonce: finalBundle.nonce, gasLimit: finalBundle.gasLimit,
        code: quickAccCredentials && quickAccCredentials.code
      }
    )
    if (!success) {
      if (message.includes('invalid confirmation code')) {
        addToast('Unable to sign: wrong confirmation code', { error: true })
        return
      }
      throw new Error(`Secondary key error: ${message}`)
    }
    if (confCodeRequired) {
      setSigningStatus({ quickAcc: true, finalBundle })
    } else {
      if (!signature) throw new Error(`QuickAcc internal error: there should be a signature`)
      if (!account.primaryKeyBackup) throw new Error(`No key backup found: perhaps you need to import the account via JSON?`)
      setSigningStatus({ quickAcc: true, inProgress: true })
      const pwd = quickAccCredentials.passphrase || alert('Enter passphrase')
      const wallet = await Wallet.fromEncryptedJson(JSON.parse(account.primaryKeyBackup), pwd)
      await finalBundle.sign(wallet)
      finalBundle.signatureTwo = signature
      return await finalBundle.submit({ relayerURL, fetch })
    }
  }

  const approveTxn = ({ quickAccCredentials }) => {
    if (signingStatus && signingStatus.inProgress) return
    setSigningStatus(signingStatus || { inProgress: true })

    const requestIds = bundle.requestIds
    const blockExplorerUrl = network.explorerUrl
    const approveTxnPromise = bundle.signer.quickAccManager ?
      approveTxnImplQuickAcc({ quickAccCredentials })
      : approveTxnImpl()
    approveTxnPromise.then(bundleResult => {
      // special case for approveTxnImplQuickAcc
      if (!bundleResult) return

      // be careful not to call this after onDimiss, cause it might cause state to be changed post-unmount
      setSigningStatus(null)

      // Inform everything that's waiting for the results (eg WalletConnect)
      resolveMany(requestIds, { success: bundleResult.success, result: bundleResult.txId, message: bundleResult.message })

      if (bundleResult.success) addToast((
        <span>Transaction signed and sent successfully!
          &nbsp;Click to view on block explorer.
        </span>), { url: blockExplorerUrl+'/tx/'+bundleResult.txId })
      else addToast(`Transaction error: ${bundleResult.message || 'unspecified error'}`, { error: true })
      onDismiss()
    })
    .catch(e => {
      setSigningStatus(null)
      console.error(e)
      if (e && e.message.includes('must provide an Ethereum address')) {
        addToast(`Signing error: not connected with the correct address. Make sure you're connected with ${bundle.signer.address}.`, { error: true })
      } else {
        console.log(e.message)
        addToast(`Signing error: ${e.message || e}`, { error: true })
      }
    })
  }

  const rejectTxn = () => {
    resolveMany(bundle.requestIds, { message: 'rejected' })
  }

  return (<div id='sendTransaction'>
      <div className='dismiss' onClick={onDismiss}>
        <FaChevronLeft size={35}/><span>back</span>
      </div>
      <h2>Pending transactions: {bundle.txns.length}</h2>
      <div className='panelHolder'>
          <div className='panel'>
              <div className='heading'>
                      <div className='title'>
                          <GiSpectacles size={35}/>
                          Transaction summary
                      </div>
                      <div className='listOfTransactions'>
                          {bundle.txns.map((txn, i) => {
                            const isFirstFailing = estimation && !estimation.success && estimation.firstFailing === i
                            return (<TxnPreview
                              key={bundle.requestIds[i]}
                              network={network}
                              onDismiss={() => resolveMany([bundle.requestIds[i]], { message: 'rejected' })}
                              txn={txn} bundle={bundle}
                              isFirstFailing={isFirstFailing}/>
                            )
                          })}
                      </div>
                      <div className='batchingNote'>
                          <b>DEGEN TIP:</b> You can sign multiple transactions at once. Add more transactions to this batch by interacting with a connected dApp right now.
                      </div>
              </div>
          </div>
          <div className='secondaryPanel'>
              <div className='panel feePanel'>
                  <div className='heading'>
                          <div className='title'>
                              <GiTakeMyMoney size={35}/>
                              Fee
                          </div>
                          <FeeSelector
                            disabled={signingStatus && signingStatus.finalBundle}
                            signer={bundle.signer}
                            estimation={estimation}
                            setEstimation={setEstimation}
                            network={network}
                            feeSpeed={feeSpeed}
                            setFeeSpeed={setFeeSpeed}
                          ></FeeSelector>
                  </div>
              </div>
              <div className='panel actions'>
                  <div className='heading'>
                      <div className='title'>
                          <FaSignature size={35}/>
                          Sign
                      </div>
                  </div>
                  {(bundle.signer.quickAccManager && !relayerURL) ? (
                    <FailingTxn message='Signing transactions with an email/passphrase account without being connected to the relayer is unsupported.'></FailingTxn>
                  ) : (
                      <Actions
                        estimation={estimation}
                        approveTxn={approveTxn} rejectTxn={rejectTxn}
                        signingStatus={signingStatus}
                        feeSpeed={feeSpeed}
                      />
                  )}
              </div>
          </div>
      </div>
  </div>)
}

function Actions({ estimation, feeSpeed, approveTxn, rejectTxn, signingStatus }) {
  const [quickAccCredentials, setQuickAccCredentials] = useState({ code: '', passphrase: '' })
  const form = useRef(null)

  const rejectButton = (
    <button type='button' className='rejectTxn' onClick={rejectTxn}>Reject</button>
  )
  const insufficientFee = estimation && estimation.feeInUSD
    && !isTokenEligible(estimation.selectedFeeToken, feeSpeed, estimation)
  const willFail = (estimation && !estimation.success) || insufficientFee
  if (willFail) {
    return (<div className='buttons'>
      {rejectButton}
    </div>)
  }

  const signButtonLabel = signingStatus && signingStatus.inProgress ?
    (<><Loading/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Signing...</>)
    : (<>Sign and send</>)

  if (signingStatus && signingStatus.quickAcc) {
    return (<>
      <input type='password' required minLength={8} placeholder='Passphrase' value={quickAccCredentials.passphrase} onChange={e => setQuickAccCredentials({ ...quickAccCredentials, passphrase: e.target.value })}></input>
      <form ref={form} className='quickAccSigningForm' onSubmit={e => { e.preventDefault() }}>
        {/* Changing the autoComplete prop to a random string seems to disable it more often */}
        <input
          type='text' pattern='[0-9]+'
          title='Confirmation code should be 6 digits'
          autoComplete='nope'
          required minLength={6} maxLength={6}
          placeholder='Confirmation code'
          value={quickAccCredentials.code}
          onChange={e => setQuickAccCredentials({ ...quickAccCredentials, code: e.target.value })}
        ></input>
        {rejectButton}
        <button className='approveTxn'
          onClick={() => {
            if (!form.current.checkValidity()) return
            approveTxn({ quickAccCredentials })
          }}
        >
          {signButtonLabel}
        </button>
      </form>
    </>)
  }

  return (<div className='buttons'>
      {rejectButton}
      <button className='approveTxn' disabled={!estimation || signingStatus} onClick={approveTxn}>
        {signButtonLabel}
      </button>
  </div>)
}

function TxnPreview ({ txn, onDismiss, bundle, network, isFirstFailing }) {
  const [isExpanded, setExpanded] = useState(false)
  const contractName = getContractName(txn, network.id)
  return (
    <div className={isFirstFailing ? 'txnSummary firstFailing' : 'txnSummary'}>
        <div>{getTransactionSummary(txn, bundle.network, bundle.identity)}</div>
        {isFirstFailing ? (<div className='firstFailingLabel'>This is the first failing transaction.</div>) : (<></>)}

        {
          isExpanded ? (<div className='advanced'>
            <div><b>Interacting with (<i>to</i>):</b> {txn[0]}{contractName ? ` (${contractName})` : ''}</div>
            <div><b>{network.nativeAssetSymbol} to be sent (<i>value</i>):</b> {formatUnits(txn[1], 18)}</div>
            <div><b>Data:</b> {txn[2]}</div>
          </div>) : (<></>)
        }

        <span className='expandTxn' onClick={() => setExpanded(e => !e)}>
          {isExpanded ? (<FaChevronUp/>) : (<FaChevronDown/>)}
        </span>
        <span className='dismissTxn' onClick={onDismiss}><FaTimes/></span>
    </div>
  )
}