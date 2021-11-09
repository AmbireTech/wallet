import './App.scss'

import {
  HashRouter as Router,
  Switch,
  Route,
  Redirect
} from 'react-router-dom'
import { useState, useEffect } from 'react'
import EmailLogin from './components/EmailLogin/EmailLogin'
import AddAccount from './components/AddAccount/AddAccount'
import Wallet from './components/Wallet/Wallet'
import ToastProvider from './components/ToastProvider/ToastProvider'
import SendTransaction from './components/SendTransaction/SendTransaction'
import useAccounts from './hooks/accounts'
import useNetwork from './hooks/network'
import useWalletConnect from './hooks/walletconnect'
import useNotifications from './hooks/notifications'
import { usePortfolio } from './hooks'

// @TODO consts/cfg, dev vs prod
const relayerURL = 'http://localhost:1934'

function AppInner () {
  const { accounts, selectedAcc, onSelectAcc, onAddAccount } = useAccounts()
  const { network, setNetwork, allNetworks } = useNetwork()
  const { connections, connect, disconnect, requests, resolveMany } = useWalletConnect({
    account: selectedAcc,
    chainId: network.chainId
  })
  const portfolio = usePortfolio({
    currentNetwork: network.id,
    account: selectedAcc
  })

  // Show notifications for all requests
  useNotifications(requests)

  // Navigate to the send transaction dialog if we have a new txn
  const eligibleRequests = requests
    .filter(({ type, chainId, account }) =>
      type === 'eth_sendTransaction'
      && chainId === network.chainId
      && account === selectedAcc
    )
  const [sendTxnsShowing, setSendTxnsShowing] = useState(() => !!eligibleRequests.length)
  useEffect(
    () => setSendTxnsShowing(!!eligibleRequests.length),
    [eligibleRequests.length]
  )
  const onDismiss = () => sendTxnsShowing(false)
  
  return (<>
    {sendTxnsShowing ? (
      <SendTransaction accounts={accounts} selectedAcc={selectedAcc} network={network} requests={eligibleRequests} resolveMany={resolveMany} relayerURL={relayerURL} onDismiss={onDismiss}>
      </SendTransaction>
      ) : (<></>)
    }
    <Switch>
      <Route path="/add-account">
        <AddAccount relayerURL={relayerURL} onAddAccount={onAddAccount}></AddAccount>
      </Route>

      <Route path="/email-login">
        <EmailLogin relayerURL={relayerURL} onAddAccount={onAddAccount}></EmailLogin>
      </Route>

      <Route path="/wallet">
        <Wallet match={{ url: "/wallet" }} accounts={accounts} selectedAcc={selectedAcc} portfolio={portfolio} onSelectAcc={onSelectAcc} allNetworks={allNetworks} network={network} setNetwork={setNetwork} connections={connections} connect={connect} disconnect={disconnect}></Wallet>
      </Route>

      <Route path="/">
        <Redirect to={selectedAcc ? "/wallet/dashboard" : "/add-account" }/>
      </Route>

    </Switch>
  </>)
}

// handles all the providers so that we can use provider hooks inside of AppInner
export default function App() {
  return (
    <ToastProvider>
      <Router>
        <AppInner/>
      </Router>
    </ToastProvider>
  )
}