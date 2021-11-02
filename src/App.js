import './App.css'

import { useState } from 'react'
import {
  HashRouter as Router,
  Switch,
  Route,
  Redirect
} from 'react-router-dom'
import EmailLogin from './components/EmailLogin/EmailLogin'
import AddAccount from './components/AddAccount/AddAcount'
import Platform from './components/Platform/Platform'
import useAccounts from './hooks/accounts'
import useNetwork from './hooks/network'
import useWalletConnect from './hooks/walletconnect'

// @TODO get rid of these, should be in the SignTransaction component
import fetch from 'node-fetch'
import { Bundle } from 'adex-protocol-eth/js'
import { TrezorSubprovider } from '@0x/subproviders/lib/src/subproviders/trezor' // https://github.com/0xProject/0x-monorepo/issues/1400
import TrezorConnect from 'trezor-connect'
import { ethers, getDefaultProvider } from 'ethers'

// @TODO consts/cfg
const relayerURL = 'http://localhost:1934'

function App() {
  const { accounts, selectedAcc, onSelectAcc, onAddAccount } = useAccounts()
  const { network, setNetwork, allNetworks } = useNetwork()
  // Note: this one is temporary until we figure out how to manage a queue of those
  const [userAction, setUserAction] = useState(null)
  const onCallRequest = async (payload, wcConnector) => {
    // @TODO handle more
    if (payload.method !== 'eth_sendTransaction') return

    console.log('call onCallRequest')

    if (window.Notification && Notification.permission !== 'denied') {
      Notification.requestPermission(function(status) {  // status is "granted", if accepted by user
        // @TODO parse transaction and actually show what we're signing
        if (status !== 'granted') return
         /*var n = */new Notification('Ambire Wallet: sign transaction', { 
          body: `Transaction to ${payload.params[0].to}`,
          //icon: '/path/to/icon.png' // optional
        })
      })
    }

    const provider = getDefaultProvider(network.rpc)
    const rawTxn = payload.params[0]
    // @TODO: add a subtransaction that's supposed to `simulate` the fee payment so that
    // we factor in the gas for that; it's ok even if that txn ends up being
    // more expensive (eg because user chose to pay in native token), cause we stay on the safe (higher) side
    // or just add a fixed premium on gasLimit
    const bundle = new Bundle({
      network: network.id,
      identity: selectedAcc,
      // @TODO: take the gasLimit from the rawTxn
      // @TODO "|| '0x'" where applicable
      txns: [[rawTxn.to, rawTxn.value, rawTxn.data]],
      signer: accounts.find(x => x.id === selectedAcc).signer
    })

    const estimation = await bundle.estimate({ relayerURL, fetch })
    console.log(estimation)
    if (!estimation.success) {
      // @TODO err handling here
      console.error('estimation error', estimation)
      return
    }
    // pay a fee to the relayer
    bundle.txns.push(['0x942f9CE5D9a33a82F88D233AEb3292E680230348', Math.round(estimation.feeInNative.fast*1e18).toString(10), '0x'])
    await bundle.getNonce(provider)
    console.log(bundle.nonce)

    setUserAction({
      bundle,
      fn: async () => {
        // @TODO we have to cache `providerTrezor` otherwise it will always ask us whether we wanna expose the pub key
        const providerTrezor = new TrezorSubprovider({ trezorConnectClientApi: TrezorConnect })
        // NOTE: for metamask, use `const provider = new ethers.providers.Web3Provider(window.ethereum)`
        // as for Trezor/ledger, alternatively we can shim using https://www.npmjs.com/package/web3-provider-engine and then wrap in Web3Provider
        const walletShim = {
          signMessage: hash => providerTrezor.signPersonalMessageAsync(ethers.utils.hexlify(hash), bundle.signer.address)
        }
        await bundle.sign(walletShim)
        const bundleResult = await bundle.submit({ relayerURL, fetch })
        console.log(bundleResult)
        console.log(providerTrezor._initialDerivedKeyInfo)
        wcConnector.approveRequest({
          id: payload.id,
          result: bundleResult.txId,
        })
        // we can now approveRequest in this and return the proper result
      }
    })
  }
  const { connections, disconnect } = useWalletConnect({
    account: selectedAcc,
    chainId: network.chainId,
    onCallRequest
  })


  return (
    <Router>
      {/*<nav>
              <Link to="/email-login">Login</Link>
      </nav>*/}

      <Switch>
        <Route path="/add-account">
          <AddAccount relayerURL={relayerURL} onAddAccount={onAddAccount}></AddAccount>
        </Route>

        <Route path="/email-login">
          <EmailLogin relayerURL={relayerURL} onAddAccount={onAddAccount}></EmailLogin>
        </Route>

        <Route path="/platform" component={props => Platform({ ...props,  accounts, selectedAcc, onSelectAcc, allNetworks, network, setNetwork })}>
        </Route>

        <Route path="/security"></Route>
        <Route path="/transactions"></Route>
        <Route path="/swap"></Route>
        <Route path="/earn"></Route>
        {/* TODO: connected dapps */}
        {/* TODO: tx identifier in the URL */}
        <Route path="/send-transaction">
          <div id="dashboardArea">
            {connections.map(({ session, uri }) =>
              (<div key={session.peerId} style={{ position: 'relative', top: -30 }}>
                <button onClick={() => disconnect(uri)}>Disconnect {session.peerMeta.name}</button>
              </div>)
            )}
            {userAction ? (<><div>{userAction.bundle.txns[0][0]}</div><button onClick={userAction.fn}>Send txn</button></>) : (<></>)}
          </div>
        </Route>

        <Route path="/">
          <Redirect to="/add-account" />
        </Route>

      </Switch>
    </Router>
  )
}

export default App;
