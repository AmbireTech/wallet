import './App.scss'

import {
  HashRouter as Router,
  Switch,
  Route,
  Redirect,
  useHistory
} from 'react-router-dom'
import { useEffect } from 'react'
import EmailLogin from './components/EmailLogin/EmailLogin'
import AddAccount from './components/AddAccount/AddAcount'
import Wallet from './components/Wallet/Wallet'
import ToastProvider from './components/ToastProvider/ToastProvider'
import SendTransaction from './components/SendTransaction/SendTransaction'
import useAccounts from './hooks/accounts'
import useNetwork from './hooks/network'
import useWalletConnect from './hooks/walletconnect'
import useGnosisSafe from './hooks/useGnosisSafe'
import { usePortfolio } from './hooks'

// @TODO consts/cfg, dev vs prod
const relayerURL = 'http://localhost:1934'

function AppInner () {
  const { accounts, selectedAcc, onSelectAcc, onAddAccount } = useAccounts()
  const { network, setNetwork, allNetworks } = useNetwork()
  const { connections, connect, disconnect, requests: WCRequests, resolveMany: WCResolveMany } = useWalletConnect({
    account: selectedAcc,
    chainId: network.chainId
  })

  const { requests: gnosisRequests, resolveMany: gnosisResolveMany, connect: gnosisConnect } = useGnosisSafe({
	  selectedAccount: selectedAcc,
	  network: network
	},[selectedAcc, network]);

  const requests = WCRequests.concat(gnosisRequests);
  const resolveMany = (ids, resolution) => {
  	WCResolveMany(ids, resolution);
    gnosisResolveMany(ids, resolution);
  }

  const portfolio = usePortfolio({
    currentNetwork: network.id,
    account: selectedAcc
  })

  // Navigate to the send transaction dialog if we have a new txn
  const history = useHistory()
  useEffect(() => {
    if (requests.length) history.push('/send-transaction')
  }, [requests.length, history])

  return (<>
    <Switch>
      <Route path="/add-account">
        <AddAccount relayerURL={relayerURL} onAddAccount={onAddAccount}></AddAccount>
      </Route>

      <Route path="/email-login">
        <EmailLogin relayerURL={relayerURL} onAddAccount={onAddAccount}></EmailLogin>
      </Route>

      <Route path="/send-transaction">
        <SendTransaction accounts={accounts} selectedAcc={selectedAcc} network={network} requests={requests} resolveMany={resolveMany} relayerURL={relayerURL}>
        </SendTransaction>
      </Route>

      <Route path="/wallet">
        <Wallet
			match={{ url: "/wallet" }}
			accounts={accounts}
			selectedAcc={selectedAcc}
			portfolio={portfolio}
			onSelectAcc={onSelectAcc}
			allNetworks={allNetworks}
			network={network}
			setNetwork={setNetwork}
			connections={connections}
			connect={connect}
			disconnect={disconnect}
			gnosisConnect={gnosisConnect}
		>
		</Wallet>
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
