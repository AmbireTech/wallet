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
import SignMessage from './components/SignMessage/SignMessage'
import useAccounts from './hooks/accounts'
import useNetwork from './hooks/network'
import useWalletConnect from './hooks/walletconnect'
import useGnosisSafe from './hooks/useGnosisSafe'
import useNotifications from './hooks/notifications'
import { usePortfolio } from './hooks'

const relayerURL = process.env.hasOwnProperty('REACT_APP_RELAYER_URL') ? process.env.REACT_APP_RELAYER_URL : 'http://localhost:1934'

function AppInner () {
  const { accounts, selectedAcc, onSelectAcc, onAddAccount, onRemoveAccount } = useAccounts()
  const { network, setNetwork, allNetworks } = useNetwork()
  const { connections, connect, disconnect, requests: wcRequests, resolveMany: wcResolveMany } = useWalletConnect({
    account: selectedAcc,
    chainId: network.chainId
  })
  const { requests: gnosisRequests, resolveMany: gnosisResolveMany, connect: gnosisConnect, disconnect: gnosisDisconnect } = useGnosisSafe({
	  selectedAccount: selectedAcc,
	  network: network
	}, [selectedAcc, network])

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
  const resolveMany = (ids, resolution) => {
    wcResolveMany(ids, resolution)
    gnosisResolveMany(ids, resolution)
    setInternalRequests(reqs => reqs.filter(x => !ids.includes(x.id)))
  }

  // Show notifications for all requests
  useNotifications(requests)

  // Navigate to the send transaction dialog if we have a new txn
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

  // Network shouldn't matter here
  const toSign = useMemo(() => requests
    .find(({ type, chainId, account }) => type === 'personal_sign'
      && account === selectedAcc
    ), [requests, selectedAcc])

  return (<>
    {toSign && (<SignMessage
      selectedAcc={selectedAcc}
      toSign={toSign}
      resolve={outcome => resolveMany([toSign.id], outcome)}
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

      <Route path="/wallet">
        <Wallet
          match={{ url: "/wallet" }}
          accounts={accounts}
          selectedAcc={selectedAcc}
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
          // needed by the gnosis plugins
          gnosisConnect={gnosisConnect}
          gnosisDisconnect={gnosisDisconnect}
          // required for the security and transactions pages
          relayerURL={relayerURL}
          // required by the transactions page
          eligibleRequests={eligibleRequests}
          showSendTxns={bundle => setSendTxnState({ showing: true, replacementBundle: bundle })}
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
