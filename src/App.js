import './App.css'

import { useState } from 'react'
import {
  HashRouter as Router,
  Switch,
  Route,
  Redirect
} from 'react-router-dom'
import { MdDashboard, MdLock, MdCompareArrows } from 'react-icons/md'
import { BsPiggyBank } from 'react-icons/bs'
import EmailLogin from './components/EmailLogin/EmailLogin'
import AddAccount from './components/AddAccount/AddAcount'
import useAccounts from './hooks/accounts'
import useNetwork from './hooks/network'
import useWalletConnect from './hooks/walletconnect'

// @TODO get rid of these, should be in the SignTransaction component
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
      signer: { address: localStorage.tempSigner } // @TODO
    })
    const estimation = await bundle.estimate({ relayerURL, fetch: window.fetch })
    console.log(estimation)
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
        const bundleResult = await bundle.submit({ relayerURL, fetch: window.fetch })
        console.log(bundleResult)
        wcConnector.approveRequest({
          id: payload.id,
          result: bundleResult.txId,
        })
        // we can now approveRequest in this and return the proper result
      }
    })
  }
  const { connections, connect, disconnect } = useWalletConnect({
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

        <Route path="/dashboard">
          <section id="dashboard">
            <div id="sidebar">
              <div className="logo"/>

              <div className="balance">
                <label>Balance</label>
                <div className="balanceDollarAmount"><span className="dollarSign highlight">$</span>999<span className="highlight">.00</span></div>
              </div>

             {/* TODO proper navi, programmatic selected class */}
              <div className="item selected"><MdDashboard size={30}/>Dashboard</div>
              <div className="item"><MdLock size={30}/>Security</div>
              <div className="item"><MdCompareArrows size={30}/>Transactions</div>
              <div className="item"><BsPiggyBank size={30}/>Earn</div>

            </div>

            {/* Top-right dropdowns */}
            <div>
              <select id="accountSelector" onChange={ ev => onSelectAcc(ev.target.value) } defaultValue={selectedAcc}>
                {accounts.map(acc => (<option key={acc._id}>{acc._id}</option>))}
              </select>

              <select id="networkSelector" onChange = { ev => setNetwork(ev.target.value) } defaultValue={network.name}>
                {allNetworks.map(network => (<option key={network.id}>{network.name}</option>))}
              </select>
            </div>

            <div id="dashboardArea">
              {connections.map(({ session, uri }) =>
                (<div key={session.peerId} style={{ marginBottom: 20 }}>
                  <button onClick={() => disconnect(uri)}>Disconnect {session.peerMeta.name}</button>
                </div>)
              )}
              {userAction ? (<><div>{userAction.bundle.txns[0][0]}</div><button onClick={userAction.fn}>Send txn</button></>) : (<></>)}
            </div>

          </section>
        </Route>
        <Route path="/security"></Route>
        <Route path="/transactions"></Route>
        <Route path="/swap"></Route>
        <Route path="/earn"></Route>
        {/* TODO: connected dapps */}
        {/* TODO: tx identifier in the URL */}
        <Route path="/approve-tx"></Route>

        <Route path="/">
          <Redirect to="/add-account" />
        </Route>

      </Switch>
    </Router>
    )
}

export default App;
