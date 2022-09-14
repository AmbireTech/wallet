import useGasTank from 'ambire-common/src/hooks/useGasTank'

import './App.scss'

import {
  HashRouter as Router,
  Switch,
  Route,
  Redirect,
  Prompt
} from 'react-router-dom'
import { useState, useEffect, useMemo, useCallback } from 'react'
import EmailLogin from './components/EmailLogin/EmailLogin'
import AddAccount from './components/AddAccount/AddAccount'
import Wallet from './components/Wallet/Wallet'
import ToastProvider from './components/ToastProvider/ToastProvider'
import ModalProvider from './components/ModalProvider/ModalProvider'
import SendTransaction from './components/SendTransaction/SendTransaction'
import SignMessage from './components/SignMessage/SignMessage'
import useAccounts from './hooks/accounts'
import useNetwork from 'ambire-common/src/hooks/useNetwork'
import useWalletConnect from './hooks/walletconnect'
import useGnosisSafe from './hooks/useGnosisSafe'
import useNotifications from './hooks/notifications'
import { useAttentionGrabber, 
  usePortfolio, 
  useAddressBook, 
  useRelayerData, 
  usePrivateMode, 
  useLocalStorage,
  useUtmTracking,
} from './hooks'
import { useToasts } from './hooks/toasts'
import { useOneTimeQueryParam } from './hooks/oneTimeQueryParam'
import WalletStakingPoolABI from 'ambire-common/src/constants/abis/WalletStakingPoolABI.json'
import useRewards from 'ambire-common/src/hooks/useRewards'
import { Contract, utils } from 'ethers'
import { getProvider } from './lib/provider'
import allNetworks from './consts/networks'
import useDapps from 'ambire-common/src/hooks/useDapps'
import { getManifestFromDappUrl } from 'ambire-common/src/services/dappCatalog'
import { fetch } from 'lib/fetch'

const relayerURL = process.env.REACT_APP_RELAYRLESS === 'true' 
                  ? null 
                  : process.env.hasOwnProperty('REACT_APP_RELAYER_URL')
                    ? process.env.REACT_APP_RELAYER_URL 
                    : 'http://localhost:1934'

setTimeout(() => {
  //console.warn('☢️ If you do, malicious code could steal your funds! ☢️')
  //console.error('Only use the console if you are an experienced developer who knows what he\'s doing')
  console.log(" ✋ Hey...! Slow down you ambitious adventurer! You want to keep your funds safe! 🦄")
  console.error('       💀 DO NOT PASTE ANY CODE HERE ! 💀')
  console.error(' _          ___   ___  _  _   ___  ___  ___         _')
  console.error('| |        |   \\ /   \\| \\| | / __|| __|| _ \\       | |')
  console.error('|_|        | |) || - || .  || (_ || _| |   /       |_|')
  console.error('(_)        |___/ |_|_||_|\\_| \\___||___||_|_\\       (_)')
  console.log('At Ambire, we care about our users 💜. Safety is our top priority! DO NOT PASTE ANYTHING HERE or it could result in the LOSS OF YOUR FUNDS!')
}, 4000)

function AppInner() {
  // basic stuff: currently selected account, all accounts, currently selected network
  const dappUrl = useOneTimeQueryParam('dappUrl')
  const [pluginData, setPluginData] = useState(null)
  const { accounts, selectedAcc, onSelectAcc, onAddAccount, onRemoveAccount, setPluginUrl } = useAccounts(useLocalStorage, pluginData?.url)
  const addressBook = useAddressBook({ accounts, useStorage: useLocalStorage })
  const { network, setNetwork } = useNetwork({ useStorage: useLocalStorage })
  const { gasTankState, setGasTankState } = useGasTank({ selectedAcc, useStorage: useLocalStorage })
  const { addToast } = useToasts()
  const dappsCatalog = useDapps({useStorage: useLocalStorage, fetch})
  const wcUri = useOneTimeQueryParam('uri')
  const utmTracking = useUtmTracking({ useStorage: useLocalStorage })

  // Signing requests: transactions/signed msgs: all requests are pushed into .requests
  const { connections, connect, disconnect, isConnecting, requests: wcRequests, resolveMany: wcResolveMany } = useWalletConnect({
    account: selectedAcc,
    chainId: network.chainId,
    initialUri: wcUri,
    allNetworks,
    setNetwork,
    useStorage: useLocalStorage
  })

  const { requests: gnosisRequests, resolveMany: gnosisResolveMany, connect: gnosisConnect, disconnect: gnosisDisconnect } = useGnosisSafe({
    selectedAccount: selectedAcc,
    network: network,
    useStorage: useLocalStorage
  }, [selectedAcc, network])

  // Attach meta data to req, if needed
  const attachMeta = async req => {
    let meta

    const WALLET_TOKEN_ADDRESS = '0x88800092ff476844f74dc2fc427974bbee2794ae'
    const WALLET_STAKING_ADDRESS = '0x47cd7e91c3cbaaf266369fe8518345fc4fc12935'

    //polygon tests
    // const WALLET_TOKEN_ADDRESS = '0xe9415e904143e42007865e6864f7f632bd054a08'
    // const WALLET_STAKING_ADDRESS = '0xec3b10ce9cabab5dbf49f946a623e294963fbb4e'

    const shouldAttachMeta =  [WALLET_TOKEN_ADDRESS, WALLET_STAKING_ADDRESS].includes(req.txn.to.toLowerCase())

    if (shouldAttachMeta) {
      const WALLET_STAKING_POOL_INTERFACE = new utils.Interface(WalletStakingPoolABI)
      const provider = getProvider(network.id)
      const stakingTokenContract = new Contract(WALLET_STAKING_ADDRESS, WALLET_STAKING_POOL_INTERFACE, provider)
      const shareValue = await stakingTokenContract.shareValue()
      const { walletUsdPrice: walletTokenUsdPrice, xWALLETAPY: APY } = rewardsData.rewards

      meta = {
        xWallet: {
          APY,
          shareValue,
          walletTokenUsdPrice,
        },
      }
    }

    if (!meta) return req

    return { ...req, meta: { ...req.meta && req.meta, ...meta }}
  }

  // Internal requests: eg from the Transfer page, Security page, etc. - requests originating in the wallet UI itself
  // unlike WalletConnect or SafeSDK requests, those do not need to be persisted
  const [internalRequests, setInternalRequests] = useState([])
  const addRequest = async req => {
    const request = await attachMeta(req)

    return setInternalRequests(reqs => [...reqs, request])
  }

  // Merge all requests
  const requests = useMemo(
    () => [...internalRequests, ...wcRequests, ...gnosisRequests]
      .filter(({ account }) => accounts.find(({ id }) => id === account)),
    [wcRequests, internalRequests, gnosisRequests, accounts]
  )
  const resolveMany = (ids, resolution) => {
    wcResolveMany(ids, resolution)
    gnosisResolveMany(ids, resolution)
    setInternalRequests(reqs => reqs.filter(x => !ids.includes(x.id)))
  }

  // Portfolio: this hook actively updates the balances/assets of the currently selected user
  const portfolio = usePortfolio({
    currentNetwork: network.id,
    account: selectedAcc,
    useStorage: useLocalStorage
  })

  const privateMode = usePrivateMode(useLocalStorage)

  const [userSorting, setUserSorting] = useLocalStorage({
    key: 'userSorting',
    defaultValue: {}
  })
  
  // Gas Tank: Adding default state when the account is changed or created
  if (gasTankState.length && !gasTankState.find(i => i.account === selectedAcc)) {
    setGasTankState([...gasTankState, { account: selectedAcc, isEnabled: false }])
  } 


  // Handling transaction signing requests
  // Show the send transaction full-screen modal if we have a new txn
  const eligibleRequests = useMemo(() => requests
    .filter(({ type, chainId, account }) =>
      type === 'eth_sendTransaction'
      && chainId === network.chainId
      && account === selectedAcc
    ), [requests, network.chainId, selectedAcc])
  // Docs: the state is { showing: bool, replacementBundle, replaceByDefault: bool, mustReplaceNonce: number }
  // mustReplaceNonce is set when the end goal is to replace a particular transaction, and if that txn gets mined we should stop the user from doing anything
  // mustReplaceNonce must always be used together with either replaceByDefault: true or replacementBundle
  const [sendTxnState, setSendTxnState] = useState(() => ({ showing: !!eligibleRequests.length }))
  useEffect(
    () => setSendTxnState(prev => ({
      showing: !!eligibleRequests.length,
      // we only keep those if there are transactions, otherwise zero them
      replaceByDefault: eligibleRequests.length ? prev.replaceByDefault : null,
      mustReplaceNonce: eligibleRequests.length ? prev.mustReplaceNonce : null,
    })),
    [eligibleRequests.length]
  )
  const showSendTxns = (replacementBundle, replaceByDefault = false) => setSendTxnState({ showing: true, replacementBundle, replaceByDefault })
  // keep values such as replaceByDefault and mustReplaceNonce; those will be reset on any setSendTxnState/showSendTxns
  // we DONT want to keep replacementBundle - closing the dialog means you've essentially dismissed it
  // also, if you used to be on a replacementBundle, we DON'T want to keep those props
  const onDismissSendTxns = () => setSendTxnState(prev => (prev.replacementBundle ? { showing: false } : {
    showing: false,
    replaceByDefault: prev.replaceByDefault,
    mustReplaceNonce: prev.mustReplaceNonce
  }))

  // Handling message signatures
  // Network shouldn't matter here
  const everythingToSign = useMemo(() => requests
    .filter(({ type, account }) => (type === 'personal_sign' || type === 'eth_sign' || type === 'eth_signTypedData_v4' || type === 'eth_signTypedData')
      && account === selectedAcc
    ), [requests, selectedAcc])

  // Handling the back button
  // When the user presses back, we first hide the SendTransactions dialog (keeping the queue)
  // Then, signature requests will need to be dismissed one by one, starting with the oldest
  const onPopHistory = () => {
    if (sendTxnState.showing) {
      setSendTxnState({ showing: false })
      return false
    }
    if (everythingToSign.length) {
      resolveMany([everythingToSign[0].id], { message: 'Ambire user rejected the signature request' })
      return false
    }
    return true
  }

  // Keeping track of sent transactions
  const [sentTxn, setSentTxn] = useState([])
  const onBroadcastedTxn = hash => {
    if (!hash) {
      addToast('Transaction successfully signed and will be broadcasted to the network later', { timeout: 15000 })
      return
    }
    setSentTxn(sentTxn => [...sentTxn, { confirmed: false, hash }])
    addToast((
      <span>Transaction signed and sent successfully!
        &nbsp;Click to view on block explorer.
      </span>
    ), { url: network.explorerUrl + '/tx/' + hash, timeout: 15000 })
  }
  const confirmSentTx = txHash => setSentTxn(sentTxn => {
    const tx = sentTxn.find(tx => tx.hash === txHash)
    tx.confirmed = true
    return [
      ...sentTxn.filter(tx => tx.hash !== txHash),
      tx
    ]
  })

  // Show notifications for all requests
  useNotifications(requests, request => {
    onSelectAcc(request.account)
    setNetwork(request.chainId)
    setSendTxnState(state => ({ ...state, showing: true }))
  }, portfolio, selectedAcc, network, sentTxn, confirmSentTx)

  useAttentionGrabber({
    eligibleRequests,
    isSendTxnShowing: sendTxnState.showing,
    onSitckyClick: useCallback(() => setSendTxnState({ showing: true }), [])
  })

  const rewardsData = useRewards({ relayerURL, accountId: selectedAcc, useRelayerData })

  // Checks if Thank you page needs to be shown
  const campaignUTM = useOneTimeQueryParam('utm_campaign')
  const [showThankYouPage, setShowThankYouPage] = useLocalStorage({
      key: 'showThankYouPage',
      defaultValue: false
  })
  const handleSetShowThankYouPage = useCallback(() => setShowThankYouPage(true), [setShowThankYouPage])
  useEffect(() => campaignUTM && handleSetShowThankYouPage(), [handleSetShowThankYouPage, campaignUTM])

  useEffect(() => {
    if(!dappUrl) return
    async function checkPluginData() {
      const manifest = await getManifestFromDappUrl(fetch, dappUrl)
      if(manifest) { 
        setPluginData(manifest)
        setPluginUrl(manifest.url)
      }
    }
    checkPluginData()
      .catch(e => {
        console.error('checkPluginData:', e)
      })
  }, [dappUrl, setPluginUrl])

  return (<>
    <Prompt
      message={(location, action) => {
        if (action === 'POP') return onPopHistory()
        return true
      }}/>

    {!!everythingToSign.length && (<SignMessage
      selectedAcc={selectedAcc}
      account={accounts.find(x => x.id === selectedAcc)}
      everythingToSign={everythingToSign}
      totalRequests={everythingToSign.length}
      connections={connections}
      relayerURL={relayerURL}
      network={network}
      resolve={outcome => resolveMany([everythingToSign[0].id], outcome)}
    ></SignMessage>)}

    {sendTxnState.showing ? (
      <SendTransaction
        accounts={accounts}
        selectedAcc={selectedAcc}
        network={network}
        requests={eligibleRequests}
        resolveMany={resolveMany}
        relayerURL={relayerURL}
        onDismiss={onDismissSendTxns}
        replacementBundle={sendTxnState.replacementBundle}
        replaceByDefault={sendTxnState.replaceByDefault}
        mustReplaceNonce={sendTxnState.mustReplaceNonce}
        onBroadcastedTxn={onBroadcastedTxn}
        gasTankState={gasTankState}
      ></SendTransaction>
    ) : (<></>)
    }

    <Switch>
      <Route path="/add-account">
        <AddAccount relayerURL={relayerURL} onAddAccount={onAddAccount} utmTracking={utmTracking} pluginData={pluginData}></AddAccount>
      </Route>

      <Route path="/email-login">
        <EmailLogin relayerURL={relayerURL} onAddAccount={onAddAccount}></EmailLogin>
      </Route>

      {selectedAcc ?
        <Route path="/wallet">
          <Wallet
            match={{ url: "/wallet" }}
            accounts={accounts}
            selectedAcc={selectedAcc}
            addressBook={addressBook}
            portfolio={portfolio}
            onSelectAcc={onSelectAcc}
            onRemoveAccount={onRemoveAccount}
            allNetworks={allNetworks}
            network={network}
            setNetwork={setNetwork}
            addRequest={addRequest}
            connections={connections}
            // needed by the top bar to disconnect/connect dapps
            connect={connect}
            disconnect={disconnect}
            isWcConnecting={isConnecting}
            // needed by the gnosis plugins
            gnosisConnect={gnosisConnect}
            gnosisDisconnect={gnosisDisconnect}
            // required for the security and transactions pages
            relayerURL={relayerURL}
            // required by the transactions page
            eligibleRequests={eligibleRequests}
            showSendTxns={showSendTxns}
            setSendTxnState={setSendTxnState}
            onAddAccount={onAddAccount}
            rewardsData={rewardsData}
            privateMode={privateMode}
            useStorage={useLocalStorage}
            userSorting={userSorting}
            setUserSorting={setUserSorting}
            dappsCatalog={dappsCatalog}
            gasTankState={gasTankState}
            setGasTankState={setGasTankState}
            showThankYouPage={showThankYouPage}
          >
          </Wallet>
        </Route> :
        <Redirect to={"/add-account"} />
      }

      <Route path="/">
        <Redirect to={selectedAcc ? "/wallet/dashboard" : "/add-account"}/>
      </Route>

    </Switch>
  </>)
}

// handles all the providers so that we can use provider hooks inside of AppInner
export default function App() {
  return (
    <Router>
      <ToastProvider>
        <ModalProvider>
          <AppInner/>
        </ModalProvider>
      </ToastProvider>
    </Router>
  )
}
