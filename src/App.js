import './App.scss'

import {
  HashRouter as Router,
  Switch,
  Route,
  Redirect
} from 'react-router-dom'
import EmailLogin from './components/EmailLogin/EmailLogin'
import AddAccount from './components/AddAccount/AddAcount'
import Wallet from './components/Wallet/Wallet'
import ToastProvider from './components/ToastProvider/ToastProvider'
import SendTransaction from './components/SendTransaction/SendTransaction'
import useAccounts from './hooks/accounts'
import useNetwork from './hooks/network'
import useWalletConnect from './hooks/walletconnect'

// @TODO consts/cfg, dev vs prod
const relayerURL = 'http://localhost:1934'

function AppInner () {
  const { accounts, selectedAcc, onSelectAcc, onAddAccount } = useAccounts()
  const { network, setNetwork, allNetworks } = useNetwork()
  const { connections, connect, disconnect, requests, resolveMany } = useWalletConnect({
    account: selectedAcc,
    chainId: network.chainId
  })

  return (<>
    <Switch>
      <Route path="/add-account">
        <AddAccount relayerURL={relayerURL} onAddAccount={onAddAccount}></AddAccount>
      </Route>

      <Route path="/email-login">
        <EmailLogin relayerURL={relayerURL} onAddAccount={onAddAccount}></EmailLogin>
      </Route>

      <Route path="/wallet">
        <Wallet match={{ url: "/wallet" }} accounts={accounts} selectedAcc={selectedAcc} onSelectAcc={onSelectAcc} allNetworks={allNetworks} network={network} setNetwork={setNetwork} connections={connections} connect={connect} disconnect={disconnect}></Wallet>
      </Route>

      <Route path="/security"></Route>
      <Route path="/transactions"></Route>
      <Route path="/swap"></Route>
      <Route path="/earn"></Route>

      <Route path="/send-transaction">
        <SendTransaction accounts={accounts} selectedAcc={selectedAcc} network={network} requests={requests} resolveMany={resolveMany} relayerURL={relayerURL}>
        </SendTransaction>

      </Route>

      <Route path="/">
        <Redirect to="/add-account" />
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