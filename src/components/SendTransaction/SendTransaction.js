//import { GrInspect } from 'react-icons/gr'
// GiObservatory is also interesting
import { GiTakeMyMoney, GiSpectacles } from 'react-icons/gi'
import { FaSignature, FaChevronLeft } from 'react-icons/fa'
import { MdOutlineAccountCircle } from 'react-icons/md'
import './SendTransaction.css'
import { useEffect, useState, useMemo } from 'react'
import fetch from 'node-fetch'
import { Bundle } from 'adex-protocol-eth/js'
import { getDefaultProvider, Wallet } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import * as blockies from 'blockies-ts';
import { useToasts } from '../../hooks/toasts'
import { getWallet } from '../../lib/getWallet'
import accountPresets from '../../consts/accountPresets'
import { FeeSelector, FailingTxn } from './FeeSelector'
import Actions from './Actions'
import TxnPreview from '../common/TxnPreview/TxnPreview'
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
  bundle.extraGas = requests.map(x => x.extraGas || 0).reduce((a, b) => a + b, 0)
  bundle.requestIds = requests.map(x => x.id)
  return bundle
}

export default function SendTransaction({ relayerURL, accounts, network, selectedAcc, requests, resolveMany, replacementBundle, onDismiss }) {
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
      <h3 className='error'>No account or no requests: should never happen.</h3>
  </div>)
  return (<SendTransactionWithBundle
      relayerURL={relayerURL}
      bundle={bundle}
      network={network}
      account={account}
      resolveMany={resolveMany}
      onDismiss={onDismiss}
  />)
}

function SendTransactionWithBundle ({ bundle, network, account, resolveMany, relayerURL, replacementBundle, onDismiss }) {
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
      // set nonce here when we implement "replace current pending transaction"
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
      gasLimit: estimation.gasLimit + addedGas + (bundle.extraGas || 0)
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
      if (typeof finalBundle.nonce !== 'number') await finalBundle.getNonce(provider)
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

    const finalBundle = (signingStatus && signingStatus.finalBundle) || getFinalBundle()
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
      const skipResolve = !bundleResult.success && bundleResult.message && bundleResult.message.match(/underpriced/i)
      if (!skipResolve && requestIds) resolveMany(requestIds, { success: bundleResult.success, result: bundleResult.txId, message: bundleResult.message })

      if (bundleResult.success) {
        addToast((
          <span>Transaction signed and sent successfully!
            &nbsp;Click to view on block explorer.
          </span>), { url: blockExplorerUrl+'/tx/'+bundleResult.txId, timeout: 15000 })
        onDismiss()
      } else addToast(`Transaction error: ${bundleResult.message || 'unspecified error'}`, { error: true })
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
        console.log(e.message)
        addToast(`Signing error: ${e.message || e}`, { error: true })
      }
    })
  }

  // Not applicable when .requestIds is not defined (replacement bundle)
  const rejectTxn = bundle.requestIds && (() => {
    resolveMany(bundle.requestIds, { message: 'user rejected' })
  })

  return (<div id='sendTransaction'>
      <div className='dismiss' onClick={onDismiss}>
        <FaChevronLeft size={35}/><span>back</span>
      </div>
      <h2>Pending transactions: {bundle.txns.length}</h2>
      <div className='container'>
        <div id='topPanel' className='panel'>
          <div className='title'>
            <MdOutlineAccountCircle/>
            Signing with account:
          </div>
          <div className="content">
            <div className='account'>
              <img className='icon' src={blockies.create({ seed: account.id }).toDataURL()} alt='Account Icon'/>
              { account.id }
            </div>
            on
            <div className='network'>
              <img className='icon' src={network.icon} alt='Network Icon'/>
              { network.name }
            </div>
          </div>
        </div>
        <div id='panelHolder'>
          <div className='panel'>
              <div className='heading'>
                      <div className='title'>
                          <GiSpectacles size={35}/>
                          Transaction summary
                      </div>
                      <div className={`listOfTransactions${bundle.requestIds ? '' : ' frozen'}`}>
                          {bundle.txns.map((txn, i) => {
                            const isFirstFailing = estimation && !estimation.success && estimation.firstFailing === i
                            return (<TxnPreview
                              key={txn.join(':')}
                              onDismiss={bundle.requestIds && (() => resolveMany([bundle.requestIds[i]], { message: 'rejected' }))}
                              txn={txn} network={bundle.network} account={bundle.identity}
                              isFirstFailing={isFirstFailing}/>
                            )
                          })}
                      </div>
                      <div className='transactionsNote'>
                        {bundle.requestIds && (<>
                          <b>DEGEN TIP:</b> You can sign multiple transactions at once. Add more transactions to this batch by interacting with a connected dApp right now.
                        </>)}
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
                            disabled={signingStatus && signingStatus.finalBundle && !(estimation && !estimation.success)}
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
                        approveTxn={approveTxn}
                        rejectTxn={rejectTxn}
                        signingStatus={signingStatus}
                        feeSpeed={feeSpeed}
                      />
                  )}
              </div>
          </div>
        </div>
      </div>
  </div>)
}