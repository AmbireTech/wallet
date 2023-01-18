import { useEffect, useState, useMemo, useRef } from 'react'
import { ethers } from 'ethers'
import { getProvider } from 'ambire-common/src/services/provider'
import cn from 'classnames'

import { useSDKContext } from 'components/SDKProvider/SDKProvider'
import { useToasts } from 'hooks/toasts'
import {
  getDefaultFeeToken,
  isTokenEligible, makeBundle
 } from './helpers'
 import BackButton from './BackButton/BackButton'
import DetailsPanel from './DetailsPanel/DetailsPanel'
import TransactionPanel from './TransactionPanel/TransactionPanel'

import styles from './SendTransaction.module.scss'

const DEFAULT_SPEED = 'fast'
const REESTIMATE_INTERVAL = 15000

const REJECT_MSG = 'Ambire user rejected the request'


const isInt = x => !isNaN(x) && x !== null

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

  if (!account || !bundle.txns.length) return (<div className={styles.wrapper}>
    <h3 className={styles.error}>SendTransactions: No account or no requests: should never happen.</h3>
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
  const [signingStatus, setSigningStatus] = useState(false)
  const [feeSpeed, setFeeSpeed] = useState(DEFAULT_SPEED)
  const { addToast } = useToasts()
  const { isSDK } = useSDKContext()

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


  return (
    <div className={styles.wrapper}>
      <div className={cn(styles.container, {[styles.sdk]: isSDK})}>
        {!isSDK ? (<BackButton onDismiss={onDismiss} />): null}
        <div className={styles.containerBody}>
          <TransactionPanel
            bundle={bundle}
            estimation={estimation}
            REJECT_MSG={REJECT_MSG}
            resolveMany={resolveMany}
            signingStatus={signingStatus}
            onDismiss={onDismiss}
            panelClassName={styles.panel}
            panelTitleClassName={styles.panelTitle}
          />
          <DetailsPanel 
            estimation={estimation}
            setEstimation={setEstimation}
            network={network}
            bundle={bundle}
            relayerURL={relayerURL}
            feeSpeed={feeSpeed}
            setFeeSpeed={setFeeSpeed}
            account={account}
            signingStatus={signingStatus}
            setSigningStatus={setSigningStatus}
            isInt={isInt}
            resolveMany={resolveMany}
            onDismiss={onDismiss}
            mustReplaceNonce={mustReplaceNonce}
            replaceByDefault={replaceByDefault}
            isMounted={isMounted}
            currentAccGasTankState={currentAccGasTankState}
            REJECT_MSG={REJECT_MSG}
            onBroadcastedTxn={onBroadcastedTxn}
            panelClassName={styles.panel}
            panelTitleClassName={styles.panelTitle}
          />
        </div>
      </div>
    </div>
  )
}
