import './App.scss'

import {
  HashRouter as Router,
  Switch,
  Route,
  Redirect,
  Prompt
} from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import EmailLogin from './components/EmailLogin/EmailLogin'
import AddAccount from './components/AddAccount/AddAccount'
import Wallet from './components/Wallet/Wallet'
import ToastProvider from './components/ToastProvider/ToastProvider'
import ModalProvider from './components/ModalProvider/ModalProvider'
import SendTransaction from './components/SendTransaction/SendTransaction'
import SignMessage from './components/SignMessage/SignMessage'
import useAccounts from './hooks/accounts'
import useNetwork from './hooks/network'
import useWalletConnect from './hooks/walletconnect'
import useGnosisSafe from './hooks/useGnosisSafe'
import useNotifications from './hooks/notifications'
import { usePortfolio, useAddressBook } from './hooks'

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
}, 4000);

function AppInner () {
  // basic stuff: currently selected account, all accounts, currently selected network
  const { accounts, selectedAcc, onSelectAcc, onAddAccount, onRemoveAccount } = useAccounts()
  const { addresses, addAddress, removeAddress, isKnownAddress, isValidAddress } = useAddressBook({ accounts })
  const { network, setNetwork, allNetworks } = useNetwork()

  // Signing requests: transactions/signed msgs: all requests are pushed into .requests
  const { connections, connect, disconnect, requests: wcRequests, resolveMany: wcResolveMany } = useWalletConnect({
    account: selectedAcc,
    chainId: network.chainId
  })
  const { requests: gnosisRequests, resolveMany: gnosisResolveMany, connect: gnosisConnect, disconnect: gnosisDisconnect } = useGnosisSafe({
	  selectedAccount: selectedAcc,
	  network: network
	}, [selectedAcc, network])

  // Internal requests: eg from the Transfer page, Security page, etc. - requests originating in the wallet UI itself
  // unlike WalletConnect or SafeSDK requests, those do not need to be persisted
  const [internalRequests, setInternalRequests] = useState([])
  const addRequest = req => setInternalRequests(reqs => [...reqs, req])

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
    account: selectedAcc
  })

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
  const everythingToSign = useMemo(() => requests
    .filter(({ type, account }) => type === 'personal_sign'
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
      resolveMany([everythingToSign[0].id], { message: 'signature rejected' })
      return false
    }
    return true
  }

  // Show notifications for all requests
  useNotifications(requests, request => {
    onSelectAcc(request.account)
    setNetwork(request.chainId)
    setSendTxnState(state => ({ ...state, showing: true }))
  }, portfolio, selectedAcc, network)

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
      relayerURL={relayerURL}
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
          addresses={addresses}
          addAddress={addAddress}
          removeAddress={removeAddress}
          isKnownAddress={isKnownAddress}
          isValidAddress={isValidAddress}
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
      <ModalProvider>
        <Router>
          <AppInner/>
        </Router>
      </ModalProvider>
    </ToastProvider>
  )
}
