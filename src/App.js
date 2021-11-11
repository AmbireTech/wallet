import './App.scss'

import {
  HashRouter as Router,
  Switch,
  Route,
  Redirect
} from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import EmailLogin from './components/EmailLogin/EmailLogin'
import AddAccount from './components/AddAccount/AddAccount'
import Wallet from './components/Wallet/Wallet'
import ToastProvider from './components/ToastProvider/ToastProvider'
import SendTransaction from './components/SendTransaction/SendTransaction'
import useAccounts from './hooks/accounts'
import useNetwork from './hooks/network'
import useWalletConnect from './hooks/walletconnect'
import useGnosisSafe from './hooks/useGnosisSafe'
import useNotifications from './hooks/notifications'
import { usePortfolio } from './hooks'

// @TODO consts/cfg, dev vs prod
const relayerURL = 'http://localhost:1934'

function AppInner () {
  const { accounts, selectedAcc, onSelectAcc, onAddAccount } = useAccounts()
  const { network, setNetwork, allNetworks } = useNetwork()
  const { connections, connect, disconnect, requests: wcRequests, resolveMany: wcResolveMany } = useWalletConnect({
    account: selectedAcc,
    chainId: network.chainId
  })
  const { requests: gnosisRequests, resolveMany: gnosisResolveMany, connect: gnosisConnect, disconnect: gnosisDisconnect } = useGnosisSafe({
	  selectedAccount: selectedAcc,
	  network: network,
    verbose: 1
	}, [selectedAcc, network])

  const resolveMany = (ids, resolution) => {
    wcResolveMany(ids, resolution);
    gnosisResolveMany(ids, resolution);
  }

  const portfolio = usePortfolio({
    currentNetwork: network.id,
    account: selectedAcc
  })

  // Internal requests: eg from the Transfer page, Security page, etc. - requests originating in the wallet UI itself
  // unlike WalletConnect or SafeSDK requests, those do not need to be persisted
  const [internalRequests, setInternalRequests] = useState([])
  const addRequest = req => setInternalRequests(reqs => [...reqs, req])

  // Merge all requests
  const requests = useMemo(() => [...internalRequests, ...wcRequests, ...gnosisRequests], [wcRequests, internalRequests, gnosisRequests])

  // Show notifications for all requests
  useNotifications(requests)

  // Navigate to the send transaction dialog if we have a new txn
  const eligibleRequests = useMemo(() => requests
    .filter(({ type, chainId, account }) =>
      type === 'eth_sendTransaction'
      && chainId === network.chainId
      && account === selectedAcc
    ), [requests, network.chainId, selectedAcc])
  const [sendTxnsShowing, setSendTxnsShowing] = useState(() => !!eligibleRequests.length)
  useEffect(
    () => setSendTxnsShowing(!!eligibleRequests.length),
    [eligibleRequests.length]
  )
  const onDismiss = () => setSendTxnsShowing(false)

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
        <Wallet
          match={{ url: "/wallet" }}
          accounts={accounts}
          selectedAcc={selectedAcc}
          portfolio={portfolio}
          onSelectAcc={onSelectAcc}
          allNetworks={allNetworks}
          network={network}
          setNetwork={setNetwork}
          addRequest={addRequest}
          connections={connections}
          connect={connect}
          disconnect={disconnect}
          gnosisConnect={gnosisConnect}
          gnosisDisconnect={gnosisDisconnect}
        >
        </Wallet>
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
