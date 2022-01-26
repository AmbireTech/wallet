//import { GrInspect } from 'react-icons/gr'
// GiObservatory is also interesting
import { GiGorilla } from 'react-icons/gi'
import { FaChevronLeft } from 'react-icons/fa'
import './SendTransaction.scss'
import { useEffect, useState, useMemo, useRef } from 'react'
import fetch from 'node-fetch'
import { Bundle } from 'adex-protocol-eth/js'
import { Wallet } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import * as blockies from 'blockies-ts';
import { useToasts } from 'hooks/toasts'
import { getWallet } from 'lib/getWallet'
import accountPresets from 'consts/accountPresets'
import { FeeSelector, FailingTxn } from './FeeSelector'
import Actions from './Actions'
import TxnPreview from 'components/common/TxnPreview/TxnPreview'
import { sendNoRelayer } from './noRelayer'
import { isTokenEligible, getFeePaymentConsequences } from './helpers'
import { fetchPost } from 'lib/fetch'
import { toBundleTxn } from 'lib/requestToBundleTxn'
import { getProvider } from 'lib/provider'
import { MdInfo } from 'react-icons/md'
import { useCallback } from 'react'

const ERC20 = new Interface(require('adex-protocol-eth/abi/ERC20'))

const DEFAULT_SPEED = 'fast'
const REESTIMATE_INTERVAL = 15000

const REJECT_MSG = 'Ambire user rejected the request'

function makeBundle(account, networkId, requests) {
  const bundle = new Bundle({
    network: networkId,
    identity: account.id,
    txns: requests.map(({ txn }) => toBundleTxn(txn, account.id)),
    signer: account.signer
  })
  bundle.extraGas = requests.map(x => x.extraGas || 0).reduce((a, b) => a + b, 0)
  bundle.requestIds = requests.map(x => x.id)
  return bundle
}

function getErrorMessage(e){
  if (e && e.message === 'NOT_TIME') {
    return "Your 72 hour recovery waiting period still hasn't ended. You will be able to use your account after this lock period."
  } else if (e && e.message === 'WRONG_ACC_OR_NO_PRIV' ) {
    return "Unable to sign with this email/password account. Please contact support."
  } else if (e && e.message === 'INVALID_SIGNATURE') {
    return "Invalid signature. This may happen if you used password/derivation path on your hardware wallet."
  } else {
    return e.message || e 
  }
}

export default function SendTransaction({ relayerURL, accounts, network, selectedAcc, requests, resolveMany, replacementBundle, onBroadcastedTxn, onDismiss }) {
  // NOTE: this can be refactored at a top level to only pass the selected account (full object)
  // keeping it that way right now (selectedAcc, accounts) cause maybe we'll need the others at some point?
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
    () => replacementBundle || makeBundle(account, network.id, eligibleRequests),
    [replacementBundle, network.id, account, eligibleRequests]
  )

  if (!account || !bundle.txns.length) return (<div id='sendTransaction'>
      <h3 className='error'>SendTransactions: No account or no requests: should never happen.</h3>
  </div>)
  return (<SendTransactionWithBundle
      relayerURL={relayerURL}
      bundle={bundle}
      network={network}
      account={account}
      resolveMany={resolveMany}
      onBroadcastedTxn={onBroadcastedTxn}
      onDismiss={onDismiss}
  />)
}

function SendTransactionWithBundle ({ bundle, network, account, resolveMany, relayerURL, onBroadcastedTxn, onDismiss }) {
  const [estimation, setEstimation] = useState(null)
  const [signingStatus, setSigningStatus] = useState(false)
  const [feeSpeed, setFeeSpeed] = useState(DEFAULT_SPEED)
  const { addToast } = useToasts()
  useEffect(() => {
    if (!bundle.txns.length) return
    setEstimation(null)
  }, [bundle, setEstimation])

  // Estimate the bundle & reestimate periodically
  const currentBundle = useRef(null)
  currentBundle.current = bundle
  useEffect(() => {    // eslint-disable-next-line react-hooks/exhaustive-deps
    // We don't need to reestimate the fee when a signing process is in progress
    if (signingStatus) return
    // nor when there are no txns in the bundle, if this is even possible
    if (!bundle.txns.length) return

    // track whether the effect has been unmounted
    let unmounted = false

    // get latest estimation
    const reestimate = () => (relayerURL
      ? bundle.estimate({ relayerURL, fetch, replacing: !!bundle.minFeeInUSDPerGas })
      : bundle.estimateNoRelayer({ provider: getProvider(network.id) })
    )
      .then(estimation => {
        if (unmounted || bundle !== currentBundle.current) return
        estimation.selectedFeeToken = { symbol: network.nativeAssetSymbol }
        setEstimation(prevEstimation => {
          if (estimation.remainingFeeTokenBalances) {
            // If there's no eligible token, set it to the first one cause it looks more user friendly (it's the preferred one, usually a stablecoin)
            estimation.selectedFeeToken = (
                prevEstimation
                && isTokenEligible(prevEstimation.selectedFeeToken, feeSpeed, estimation)
                && prevEstimation.selectedFeeToken
              ) || estimation.remainingFeeTokenBalances.find(token => isTokenEligible(token, feeSpeed, estimation))
              || estimation.remainingFeeTokenBalances[0]
          }
          return estimation
        })
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
  }, [bundle, setEstimation, feeSpeed, addToast, network, relayerURL, signingStatus])

  const getFinalBundle = useCallback(() => {
    if (!relayerURL) {
      return new Bundle({
        ...bundle,
        gasLimit: estimation.gasLimit
        // set nonce here when we implement "replace current pending transaction"
      })
    }

    const feeToken = estimation.selectedFeeToken
    const { addedGas, multiplier } = getFeePaymentConsequences(feeToken, estimation)
    const toHexAmount = amnt => '0x'+Math.round(amnt).toString(16)
    const feeTxn = feeToken.symbol === network.nativeAssetSymbol
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
      gasLimit: estimation.gasLimit + addedGas + (bundle.extraGas || 0)
    })
  }, [relayerURL, bundle, estimation, feeSpeed, network.nativeAssetSymbol])

  const approveTxnImpl = async () => {
    if (!estimation) throw new Error('no estimation: should never happen')

    const finalBundle = getFinalBundle()
    const provider = getProvider(network.id)
    const signer = finalBundle.signer

    const wallet = getWallet({
      signer,
      signerExtra: account.signerExtra,
      chainId: network.chainId
    })

    if (relayerURL) {
      // Temporary way of debugging the fee cost
      // const initialLimit = finalBundle.gasLimit - getFeePaymentConsequences(estimation.selectedFeeToken, estimation).addedGas
      // finalBundle.estimate({ relayerURL, fetch }).then(estimation => console.log('fee costs: ', estimation.gasLimit - initialLimit), estimation.selectedFeeToken).catch(console.error)
      if (typeof finalBundle.nonce !== 'number') await finalBundle.getNonce(provider)
      await finalBundle.sign(wallet)
      return await finalBundle.submit({ relayerURL, fetch })
    } else {
      return await sendNoRelayer({
        finalBundle, account, network, wallet, estimation, feeSpeed, provider
      })
    }
  }

  const approveTxnImplQuickAcc = async ({ quickAccCredentials }) => {
    if (!estimation) throw new Error('no estimation: should never happen')
    if (!relayerURL) throw new Error('Email/Password account signing without the relayer is not supported yet')

    const finalBundle = (signingStatus && signingStatus.finalBundle) || getFinalBundle()
    const signer = finalBundle.signer

    if (typeof finalBundle.nonce !== 'number') {
      await finalBundle.getNonce(getProvider(network.id))
    }

    const { signature, success, message, confCodeRequired } = await fetchPost(
      `${relayerURL}/second-key/${bundle.identity}/${network.id}/sign`, {
        signer, txns: finalBundle.txns, nonce: finalBundle.nonce, gasLimit: finalBundle.gasLimit,
        code: quickAccCredentials && quickAccCredentials.code,
        // This can be a boolean but it can also contain the new signer/primaryKeyBackup, which instructs /second-key to update acc upon successful signature
        recoveryMode: finalBundle.recoveryMode
      }
    )
    if (!success) {
      if (!message) throw new Error(`Secondary key: no success but no error message`)
      if (message.includes('invalid confirmation code')) {
        addToast('Unable to sign: wrong confirmation code', { error: true })
        return
      }
      throw new Error(`Secondary key error: ${message}`)
    }
    if (confCodeRequired) {
      setSigningStatus({ quickAcc: true, finalBundle, confCodeRequired })
    } else {
      if (!signature) throw new Error(`QuickAcc internal error: there should be a signature`)
      if (!account.primaryKeyBackup) throw new Error(`No key backup found: you need to import the account from JSON or login again.`)
      setSigningStatus({ quickAcc: true, inProgress: true })
      if (!finalBundle.recoveryMode) {
        // Make sure we let React re-render without blocking (decrypting and signing will block)
        await new Promise(resolve => setTimeout(resolve, 0))
        const pwd = quickAccCredentials.passphrase || alert('Enter password')
        const wallet = await Wallet.fromEncryptedJson(JSON.parse(account.primaryKeyBackup), pwd)
        await finalBundle.sign(wallet)
      } else {
        // set both .signature and .signatureTwo to the same value: the secondary signature
        // this will trigger a timelocked txn
        finalBundle.signature = signature
      }
      finalBundle.signatureTwo = signature
      return await finalBundle.submit({ relayerURL, fetch })
    }
  }

  const approveTxn = ({ quickAccCredentials }) => {
    if (signingStatus && signingStatus.inProgress) return
    setSigningStatus(signingStatus || { inProgress: true })

    if (account.signerExtra && account.signerExtra.type === 'ledger') {
      addToast('Please confirm this transaction on your Ledger device.', { timeout: 10000 })
    }

    const requestIds = bundle.requestIds
    const approveTxnPromise = bundle.signer.quickAccManager ?
      approveTxnImplQuickAcc({ quickAccCredentials })
      : approveTxnImpl()
    approveTxnPromise.then(bundleResult => {
      // special case for approveTxnImplQuickAcc
      if (!bundleResult) return

      // be careful not to call this after onDimiss, cause it might cause state to be changed post-unmount
      setSigningStatus(null)

      // Inform everything that's waiting for the results (eg WalletConnect)
      const skipResolve = !bundleResult.success && bundleResult.message && bundleResult.message.match(/underpriced/i)
      if (!skipResolve && requestIds) resolveMany(requestIds, { success: bundleResult.success, result: bundleResult.txId, message: bundleResult.message })

      if (bundleResult.success) {
        onBroadcastedTxn(bundleResult.txId)
        onDismiss()
      } else {
        addToast(`Transaction error: ${getErrorMessage(bundleResult)}`, { error: true })  //'unspecified error'
      }
    })
    .catch(e => {
      setSigningStatus(null)
      console.error(e)
      if (e && e.message.includes('must provide an Ethereum address')) {
        addToast(`Signing error: not connected with the correct address. Make sure you're connected with ${bundle.signer.address}.`, { error: true })
      } else if (e && e.message.includes('0x6b0c')) {
        // not sure if that's actually the case with this hellish error, but after unlocking the device it no longer appeared
        // however, it stopped appearing after that even if the device is locked, so I'm not sure it's related...
        addToast(`Ledger: unknown error (0x6b0c): is your Ledger unlocked and in the Ethereum application?`, { error: true })
      } else {
        addToast(`Signing error: ${getErrorMessage(e)}`, { error: true })
      }
    })
  }

  // Not applicable when .requestIds is not defined (replacement bundle)
  const rejectTxn = bundle.requestIds && (() => {
    onDismiss()
    resolveMany(bundle.requestIds, { message: REJECT_MSG })
  })

  const accountAvatar = blockies.create({ seed: account.id }).toDataURL()

  return (
    <div id='sendTransaction'>
      <div id="titleBar">
        <div className='dismiss' onClick={onDismiss}>
          <FaChevronLeft size={35}/><span>back</span>
        </div>
      </div>

      <div className='container'>
        <div id='transactionPanel' className='panel'>
          <div className='heading'>
            <div className='title'>{ bundle.txns.length } Transaction{ bundle.txns.length > 1 ? 's' : '' } Waiting</div>
          </div>
          <div className='content'>
            <div className={`listOfTransactions${bundle.requestIds ? '' : ' frozen'}`}>
              {bundle.txns.map((txn, i) => {
                const isFirstFailing = estimation && !estimation.success && estimation.firstFailing === i
                // we need to re-render twice per minute cause of DEX deadlines
                const min = Math.floor(Date.now() / 30000)
                return (<TxnPreview
                  key={[...txn, i].join(':')}
                  // pasing an unused property to make it update
                  minute={min}
                  onDismiss={bundle.requestIds && (() => resolveMany([bundle.requestIds[i]], { message: REJECT_MSG }))}
                  txn={txn} network={bundle.network} account={bundle.identity}
                  isFirstFailing={isFirstFailing}
                  disableDismiss={!!signingStatus}
                  disableDismissLabel={"Cannot modify transaction bundle while a signing procedure is pending"}
                  />
                )
              })}
            </div>

            <div className='separator'></div>

            <div className='transactionsNote'>
              {
                bundle.requestIds ?
                  <>
                    <b><GiGorilla size={16}/> DEGEN TIP</b>
                    <span>You can sign multiple transactions at once. Add more transactions to this batch by interacting with a connected dApp right now.</span>
                  </>
                  :
                  <>
                    <b>NOTE:</b>
                    <span>You are currently replacing a pending transaction.</span>
                  </>
              }
            </div>
          </div>
        </div>

        <div id='detailsPanel' className='panel'>
          <div id="options-container">
            <div className='section' id="signing-details">
              <div className='section-title'>Signing With</div>
              <div className='section-content'>
                <div className='account'>
                  <div className='icon' style={{ backgroundImage: `url(${accountAvatar})` }}/>
                  <div className='address'>{ account.id }</div>
                </div>
                <div className='network'>
                  on
                  <div className='icon' style={{ backgroundImage: `url(${network.icon})` }}/>
                  <div className='address'>{ network.name }</div>
                </div>
              </div>
            </div>

            <FeeSelector
              disabled={signingStatus && signingStatus.finalBundle && !(estimation && !estimation.success)}
              signer={bundle.signer}
              estimation={estimation}
              setEstimation={setEstimation}
              network={network}
              feeSpeed={feeSpeed}
              setFeeSpeed={setFeeSpeed}
            ></FeeSelector>
          </div>

          {
            estimation && estimation.success && estimation.isDeployed === false && bundle.gasLimit ?
              <div className='first-tx-note'>
                <div className='first-tx-note-title'><MdInfo/>Note</div>
                <div className='first-tx-note-message'>
                  Because this is your first Ambire transaction, this fee is {(60000 / bundle.gasLimit * 100).toFixed()}% higher than usual because we have to deploy your smart wallet.
                  Subsequent transactions will be cheaper
                </div>
              </div>
              :
              null
          }

          <div id="actions-container">
            {
              bundle.signer.quickAccManager && !relayerURL ? 
                <FailingTxn message='Signing transactions with an email/password account without being connected to the relayer is unsupported.'></FailingTxn>
                :
                <div className='section' id="actions">
                  <Actions
                    estimation={estimation}
                    approveTxn={approveTxn}
                    rejectTxn={rejectTxn}
                    cancelSigning={() => setSigningStatus(null)}
                    signingStatus={signingStatus}
                    feeSpeed={feeSpeed}
                  />
                </div>
            }
          </div>
        </div>
      </div>
    </div>
  )
}
