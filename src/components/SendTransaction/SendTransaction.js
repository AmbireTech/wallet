//import { GrInspect } from 'react-icons/gr'
// GiObservatory is also interesting
import { GiGorilla } from 'react-icons/gi'
import { FaChevronLeft } from 'react-icons/fa'
import { MdOutlineClose, MdOutlineInfo, MdWarning } from 'react-icons/md'
import './SendTransaction.scss'
import { useEffect, useState, useMemo, useRef } from 'react'
import { Bundle } from 'adex-protocol-eth/js'
import { Wallet } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import * as blockies from 'blockies-ts'
import { useToasts } from 'hooks/toasts'
import { getWallet } from 'lib/getWallet'
import accountPresets from 'consts/accountPresets'
import { networkIconsById } from 'consts/networks'
import { FeeSelector, FailingTxn } from './FeeSelector'
import Actions from './Actions'
import TxnPreview from 'components/common/TxnPreview/TxnPreview'
import { sendNoRelayer } from './noRelayer'
import {
  isTokenEligible,
  // getFeePaymentConsequences,
  getFeesData,
  toHexAmount
 } from './helpers'
import { fetchPost } from 'lib/fetch'
import { toBundleTxn } from 'lib/requestToBundleTxn'
import { getProvider } from 'lib/provider'
import { MdInfo } from 'react-icons/md'
import { useCallback } from 'react'
import { ToolTip, Button, Loading } from 'components/common'
import { ethers } from 'ethers'
import { Checkbox } from 'components/common'

const ERC20 = new Interface(require('adex-protocol-eth/abi/ERC20'))

const DEFAULT_SPEED = 'fast'
const REESTIMATE_INTERVAL = 15000

const REJECT_MSG = 'Ambire user rejected the request'

const WALLET_TOKEN_SYMBOLS = ['xWALLET', 'WALLET']

const isInt = x => !isNaN(x) && x !== null

const getDefaultFeeToken = (remainingFeeTokenBalances, network, feeSpeed, estimation, currentAccGasTankState) => {
  if(!remainingFeeTokenBalances?.length) {
    return { symbol: network.nativeAssetSymbol, decimals: 18, address: '0x0000000000000000000000000000000000000000' }
  }

  return remainingFeeTokenBalances
  .sort((a, b) =>
    (WALLET_TOKEN_SYMBOLS.indexOf(b?.symbol) - WALLET_TOKEN_SYMBOLS.indexOf(a?.symbol))
    || ((b?.discount || 0) - (a?.discount || 0))
    || a?.symbol.toUpperCase().localeCompare(b?.symbol.toUpperCase())
  )
  .find(token => isTokenEligible(token, feeSpeed, estimation, currentAccGasTankState, network))
  || remainingFeeTokenBalances[0]
}

function makeBundle(account, networkId, requests) {
  const bundle = new Bundle({
    network: networkId,
    identity: account.id,
    // checking txn isArray because sometimes we receive txn in array from walletconnect. Also we use Array.isArray because txn object can have prop 0
    txns: requests.map(({ txn }) => toBundleTxn(Array.isArray(txn) ? txn[0] : txn, account.id)),
    signer: account.signer
  })
  bundle.extraGas = requests.map(x => x.extraGas || 0).reduce((a, b) => a + b, 0)
  bundle.requestIds = requests.map(x => x.id)

  // Attach bundle's meta
  if (requests.some(item => item.meta)) {
    bundle.meta = {}

    if (requests.some(item => item.meta?.addressLabel)) {
      bundle.meta.addressLabel = requests.map(x => !!x.meta?.addressLabel ? x.meta.addressLabel : { addressLabel: '', address: ''})
    }

    const xWalletReq = requests.find(x => x.meta?.xWallet)
    if (xWalletReq) {
      bundle.meta.xWallet = xWalletReq.meta.xWallet
    }
  }

  return bundle
}

function getErrorMessage(e) {
  if (e && e.message === 'NOT_TIME') {
    return 'Your 72 hour recovery waiting period still hasn\'t ended. You will be able to use your account after this lock period.'
  } else if (e && e.message === 'WRONG_ACC_OR_NO_PRIV') {
    return 'Unable to sign with this email/password account. Please contact support.'
  // NOTE: is INVALID_SIGNATURE even a real error?
  } else if (e && e.message === 'INVALID_SIGNATURE') {
    return 'Invalid signature. This may happen if you used password/derivation path on your hardware wallet.'
  } else if (e && e.message === 'INSUFFICIENT_PRIVILEGE') {
    return 'Wrong signature. This may happen if you used password/derivation path on your hardware wallet.'
  } else {
    return e.message || e
  }
}

export default function SendTransaction({ relayerURL, accounts, network, selectedAcc, requests, resolveMany, replacementBundle, replaceByDefault, mustReplaceNonce, onBroadcastedTxn, onDismiss, gasTankState }) {
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
    replaceByDefault={replaceByDefault}
    mustReplaceNonce={mustReplaceNonce}
    network={network}
    account={account}
    resolveMany={resolveMany}
    onBroadcastedTxn={onBroadcastedTxn}
    onDismiss={onDismiss}
    gasTankState={gasTankState}
  />)
}

function SendTransactionWithBundle({ bundle, replaceByDefault, mustReplaceNonce, network, account, resolveMany, relayerURL, onBroadcastedTxn, onDismiss, gasTankState }) {
  const currentAccGasTankState = network.isGasTankAvailable ? 
    gasTankState.find(i => i.account === account.id) : 
    { account: account.id, isEnabled: false }
  const [estimation, setEstimation] = useState(null)
  const [replaceTx, setReplaceTx] = useState(!!replaceByDefault)
  const [signingStatus, setSigningStatus] = useState(false)
  const [feeSpeed, setFeeSpeed] = useState(DEFAULT_SPEED)
  const { addToast } = useToasts()

  // Safety check: make sure our input parameters make sense
  if (isInt(mustReplaceNonce) && !(replaceByDefault || isInt(bundle.nonce))) {
    console.error('ERROR: SendTransactionWithBundle: mustReplaceNonce is set but we are not using replacementBundle or replaceByDefault')
    console.error('ERROR: SendTransactionWithBundle: This is a huge logical error as mustReplaceNonce is intended to be used only when we want to replace a txn')
  }

  // Keep track of unmounted: we need this to not try to modify state after async actions if the component is unmounted
  const isMounted = useRef(false)
  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  })

  // Reset the estimation when there are no txns in the bundle
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

    // Note: currently, there's no point of getting the nonce if the bundle already has a nonce
    // We may want to change this if we make a check if the currently replaced txn was already mined
    const reestimate = () => (relayerURL
        ? bundle.estimate({ relayerURL, fetch, replacing: !!bundle.minFeeInUSDPerGas, getNextNonce: true, gasTank: currentAccGasTankState.isEnabled })
        : bundle.estimateNoRelayer({ provider: getProvider(network.id) })
    )
      .then((estimation) => {
        if (unmounted || bundle !== currentBundle.current) return
        estimation.relayerless = !relayerURL
        const gasTankTokens = estimation.gasTank?.map(item => { 
          return { 
            ...item, 
            symbol: item.symbol.toUpperCase(), 
            balance: ethers.utils.parseUnits(item.balance.toFixed(item.decimals).toString(), item.decimals).toString(),
            nativeRate: item.address === '0x0000000000000000000000000000000000000000' ? null : estimation.nativeAssetPriceInUSD / item.price
          }
        })
        if (currentAccGasTankState.isEnabled) estimation.remainingFeeTokenBalances = gasTankTokens
        estimation.selectedFeeToken = getDefaultFeeToken(estimation.remainingFeeTokenBalances, network, feeSpeed, estimation, currentAccGasTankState.isEnabled, network)
        setEstimation(prevEstimation => {
          if (prevEstimation && prevEstimation.customFee) return prevEstimation
          if (estimation.remainingFeeTokenBalances) {
            // If there's no eligible token, set it to the first one cause it looks more user friendly (it's the preferred one, usually a stablecoin)
            estimation.selectedFeeToken = (
                prevEstimation
                && isTokenEligible(prevEstimation.selectedFeeToken, feeSpeed, estimation, currentAccGasTankState.isEnabled, network)
                && prevEstimation.selectedFeeToken
              )
              || getDefaultFeeToken(estimation.remainingFeeTokenBalances, network, feeSpeed, estimation, currentAccGasTankState.isEnabled, network)
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
  }, [bundle, setEstimation, feeSpeed, addToast, network, relayerURL, signingStatus, currentAccGasTankState.isEnabled ])

  // The final bundle is used when signing + sending it
  // the bundle before that is used for estimating
  const getFinalBundle = useCallback(() => {
    if (!relayerURL) {
      return new Bundle({
        ...bundle,
        gasLimit: estimation.gasLimit,
      })
    }

    const feeToken = estimation.selectedFeeToken

    const {
      feeInNative,
      // feeInUSD, // don't need fee in USD for stables as it will work with feeInFeeToken
      // Also it can be stable but not in USD
      feeInFeeToken,
      addedGas
    } = getFeesData(feeToken, estimation, feeSpeed, currentAccGasTankState.isEnabled, network)
    const feeTxn = feeToken.symbol === network.nativeAssetSymbol
      // TODO: check native decimals
      ? [accountPresets.feeCollector, toHexAmount(feeInNative, 18), '0x']
      : [feeToken.address, '0x0', ERC20.encodeFunctionData('transfer', [
        accountPresets.feeCollector,
        toHexAmount(feeInFeeToken, feeToken.decimals)
    ])]

    const nextFreeNonce = estimation.nextNonce?.nonce
    const nextNonMinedNonce = estimation.nextNonce?.nextNonMinedNonce
    // If we've passed in a bundle, use it's nonce (when using a replacementBundle); else, depending on whether we want to replace the current pending bundle,
    // either use the next non-mined nonce or the next free nonce
    const nonce = isInt(bundle.nonce) ? bundle.nonce : (replaceTx ? nextNonMinedNonce : nextFreeNonce)

    if (!!currentAccGasTankState.isEnabled) {
      let gasLimit
      if (bundle.txns.length > 1) gasLimit = estimation.gasLimit + (bundle.extraGas || 0)
      else gasLimit = estimation.gasLimit

      let value
      if (feeToken.address === "0x0000000000000000000000000000000000000000") value = feeInNative
      else {
        const fToken = estimation.remainingFeeTokenBalances.find(i => i.id === feeToken.id)
        value = fToken && estimation.feeInNative[feeSpeed] * fToken.nativeRate
      }
      
      return new Bundle({
        ...bundle,
        gasTankFee: {
          assetId: feeToken.id,
          value: ethers.utils.parseUnits(value.toFixed(feeToken.decimals), feeToken.decimals).toString()
        },
        txns: [...bundle.txns],
        gasLimit,
        nonce
      })
    }

    return new Bundle({
      ...bundle,
      txns: [...bundle.txns, feeTxn],
      gasTankFee: null,
      gasLimit: estimation.gasLimit + addedGas + (bundle.extraGas || 0),
      nonce
    })
  }, [relayerURL, estimation, feeSpeed, currentAccGasTankState.isEnabled, network, bundle, replaceTx])

  const approveTxnImpl = async () => {
    if (!estimation) throw new Error('no estimation: should never happen')

    const finalBundle = getFinalBundle()
    const provider = getProvider(network.id)
    const signer = finalBundle.signer

    // a bit redundant cause we already called it at the beginning of approveTxn, but
    // we need to freeze finalBundle in the UI in case signing takes a long time (currently only to freeze the fee selector)
    setSigningStatus({ inProgress: true, finalBundle })

    const wallet = getWallet({
      signer,
      signerExtra: account.signerExtra,
      chainId: network.chainId
    })

    if (relayerURL) {
      // Temporary way of debugging the fee cost
      // const initialLimit = finalBundle.gasLimit - getFeePaymentConsequences(estimation.selectedFeeToken, estimation).addedGas
      // finalBundle.estimate({ relayerURL, fetch }).then(estimation => console.log('fee costs: ', estimation.gasLimit - initialLimit), estimation.selectedFeeToken).catch(console.error)
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

    if (account.signerExtra && account.signerExtra.type === 'Lattice') {
      addToast('Please confirm this transaction on your Lattice device.', { timeout: 10000 })
    }

    const requestIds = bundle.requestIds
    const approveTxnPromise = bundle.signer.quickAccManager ?
      approveTxnImplQuickAcc({ quickAccCredentials })
      : approveTxnImpl()
    approveTxnPromise.then(bundleResult => {
      // special case for approveTxnImplQuickAcc: when a user interaction prevents the operation from completing
      if (!bundleResult) return

      // do not to call this after onDimiss, cause it might cause state to be changed post-unmount
      if (isMounted.current) setSigningStatus(null)

      // Inform everything that's waiting for the results (eg WalletConnect)
      const skipResolve = !bundleResult.success && bundleResult.message && bundleResult.message.match(/underpriced/i)
      if (!skipResolve && requestIds) resolveMany(requestIds, { success: bundleResult.success, result: bundleResult.txId, message: bundleResult.message })

      if (bundleResult.success) {
        onBroadcastedTxn(bundleResult.txId)
        onDismiss()
      } else {
        // to force replacementBundle to be null, so it's not filled from previous state change in App.js in useEffect
        // basically close the modal if the txn was already mined
        if (bundleResult.message.includes('was already mined')) {
          onDismiss()
        }
        addToast(`Transaction error: ${getErrorMessage(bundleResult)}`, { error: true })  //'unspecified error'
      }
    })
    .catch(e => {
      if (isMounted.current) setSigningStatus(null)
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

  const rejectTxn = () => {
    onDismiss()
    bundle.requestIds && resolveMany(bundle.requestIds, { message: REJECT_MSG })
  }

  const accountAvatar = blockies.create({ seed: account.id }).toDataURL()

  // `mustReplaceNonce` is set on speedup/cancel, to prevent the user from broadcasting the txn if the same nonce has been mined
  const canProceed = isInt(mustReplaceNonce)
    ? (
      isInt(estimation?.nextNonce?.nextNonMinedNonce)
        ? mustReplaceNonce >= estimation?.nextNonce?.nextNonMinedNonce
        : null // null = waiting to get nonce data from relayer
    )
    : true

  return (
    <div id='sendTransaction'>
      <div id="titleBar">
        <div className='dismiss' onClick={onDismiss}>
          <FaChevronLeft size={35}/>
          back
          <ToolTip label="You can go back to the main dashboard and add more transactions to this bundle in order to sign & send them all at once.">
            <MdOutlineInfo size={25}/>
          </ToolTip>
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
                  addressLabel={!!bundle.meta && bundle.meta.addressLabel}
                  />
                )
              })}
            </div>

            <div className='separator'></div>

            <div className='transactionsNote'>
              {
                // only render this if we're using the queue
                bundle.requestIds &&
                  <>
                    <b><GiGorilla size={16}/> DEGEN TIP</b>
                    <span>You can sign multiple transactions at once. Add more transactions to this batch by interacting with a connected dApp right now. Alternatively, you may click "Back" to add more transactions.</span>
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
                  <div className='icon' style={{ backgroundImage: `url(${networkIconsById[network.id]})` }}/>
                  <div className='address'>{ network.name }</div>
                </div>
              </div>
            </div>

            { /* Only lock the fee selector when the bundle is locked too - to make sure that the fee really is set in stone (won't change on the next getFinalBundle()) */ }
            {
              canProceed &&
              <FeeSelector
                disabled={signingStatus && signingStatus.finalBundle && !(estimation && !estimation.success)}
                signer={bundle.signer}
                estimation={estimation}
                setEstimation={setEstimation}
                network={network}
                feeSpeed={feeSpeed}
                setFeeSpeed={setFeeSpeed}
                onDismiss={onDismiss}
                isGasTankEnabled={currentAccGasTankState.isEnabled && !!relayerURL}
              ></FeeSelector>
            }

          </div>

         {
            // If there's `bundle.nonce` set, it means we're cancelling or speeding up, so this shouldn't even be visible
            // We also don't show this in any case in which we're forced to replace a particular transaction (mustReplaceNonce)
            !isInt(bundle.nonce) && !isInt(mustReplaceNonce) && !!estimation?.nextNonce?.pendingBundle &&
            (
              <div>
               <Checkbox
                    label='Replace currently pending transaction'
                    checked={replaceTx}
                    onChange={({ target }) => setReplaceTx(target.checked)}
                />
              </div>
            )
          }

          {
            // NOTE there's a case in which both "This transaction will replace the current pending transaction" and the checkbox will render - when we're doing a modify
            // If we are replacing a txn, look at whether canProceed is true
            isInt(mustReplaceNonce) &&
            <>
              {
                // We always warn the user if they're trying to replace a particular transaction
                // This doesn't need to show when replacing is optional
                (canProceed || canProceed === null) && <div className='replaceInfo warning' ><MdWarning /><span>This transaction bundle will replace the one that's currently pending.</span></div>
              }

              {
                // canProceed equals null means we don't have data yet
                canProceed === null &&
                <div>
                  <Loading />
                </div>
              }

              {
                canProceed === false &&
                <div id='actions-container-replace'>
                  <div className='replaceInfo info' ><MdInfo /><span>The transaction you're trying to replace has already been confirmed</span></div>
                  <div className='buttons'>
                    <Button clear icon={<MdOutlineClose/>} type='button' className='rejectTxn' onClick={rejectTxn}>Close</Button>
                  </div>
                </div>
              }
            </>
          }

          {
            canProceed &&
            <>
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
                        isGasTankEnabled={currentAccGasTankState.isEnabled && !!relayerURL}
                        network={network}
                      />
                    </div>
                }
              </div>
            </>
          }

        </div>
      </div>
    </div>
  )
}
