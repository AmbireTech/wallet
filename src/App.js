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
import useNetwork from './common/src/hooks/network'
import useWalletConnect from './hooks/walletconnect'
import useGnosisSafe from './hooks/useGnosisSafe'
import useNotifications from './hooks/notifications'
import { useAttentionGrabber, usePortfolio, useAddressBook, useRelayerData, usePrivateMode, useLocalStorage } from './hooks'
import { useToasts } from './hooks/toasts'
import { useOneTimeQueryParam } from './hooks/oneTimeQueryParam'
import WalletStakingPoolABI from './consts/WalletStakingPoolABI.json'
import { Contract, utils } from 'ethers'
import { getProvider } from './lib/provider'

const relayerURL = process.env.hasOwnProperty('REACT_APP_RELAYER_URL') ? process.env.REACT_APP_RELAYER_URL : 'http://localhost:1934'

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
  const { accounts, selectedAcc, onSelectAcc, onAddAccount, onRemoveAccount } = useAccounts(useLocalStorage)
  const addressBook = useAddressBook({ accounts, useStorage: useLocalStorage })
  const { network, setNetwork, allNetworks } = useNetwork({ useStorage: useLocalStorage })
  const { addToast } = useToasts()
  const wcUri = useOneTimeQueryParam('uri')

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
      const { usdPrice: walletTokenUsdPrice, xWALLETAPY: APY } = rewardsData.data

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

  // Show the send transaction full-screen modal if we have a new txn
  const eligibleRequests = useMemo(() => requests
    .filter(({ type, chainId, account }) =>
      type === 'eth_sendTransaction'
      && chainId === network.chainId
      && account === selectedAcc
    ), [requests, network.chainId, selectedAcc])
  const [sendTxnState, setSendTxnState] = useState(() => ({ showing: !!eligibleRequests.length }))
  useEffect(
    () => setSendTxnState({ showing: !!eligibleRequests.length }),
    [eligibleRequests.length]
  )
  const showSendTxns = bundle => setSendTxnState({ showing: true, replacementBundle: bundle })

  // Network shouldn't matter here
  const everythingToSign = useMemo(() => requests
    .filter(({ type, account }) => (type === 'personal_sign' || type === 'eth_sign')
      && account === selectedAcc
    ), [requests, selectedAcc])

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

  // Keeping track of transactions
  const [sentTxn, setSentTxn] = useState([])
  const onBroadcastedTxn = hash => {
    if (!hash) {
      addToast('Transaction signed but not broadcasted to the network!', { timeout: 15000 })
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

  const [cacheBreak, setCacheBreak] = useState(() => Date.now())
  useEffect(() => {
    if ((Date.now() - cacheBreak) > 5000) setCacheBreak(Date.now())
    const intvl = setTimeout(() => setCacheBreak(Date.now()), 30000)
    return () => clearTimeout(intvl)
  }, [cacheBreak])
  const rewardsUrl = (relayerURL && selectedAcc) ? `${relayerURL}/wallet-token/rewards/${selectedAcc}?cacheBreak=${cacheBreak}` : null
  const rewardsData = useRelayerData(rewardsUrl)

  return (<>
    <Prompt
      message={(location, action) => {
        if (action === 'POP') return onPopHistory()
        return true
      }}/>

    {!!everythingToSign.length && (<SignMessage
      selectedAcc={selectedAcc}
      account={accounts.find(x => x.id === selectedAcc)}
      toSign={everythingToSign[0]}
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
        onDismiss={() => setSendTxnState({ showing: false })}
        replacementBundle={sendTxnState.replacementBundle}
        replaceByDefault={sendTxnState.replaceByDefault}
        onBroadcastedTxn={onBroadcastedTxn}
      ></SendTransaction>
    ) : (<></>)
    }

    <Switch>
      <Route path="/add-account">
        <AddAccount relayerURL={relayerURL} onAddAccount={onAddAccount}></AddAccount>
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
            userSorting={userSorting}
            setUserSorting={setUserSorting}
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
