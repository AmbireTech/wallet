import './App.css'

import { useEffect } from 'react'
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
import useWalletConnect from './hooks/walletconnect'

// @TODO consts/cfg
const relayerURL = 'http://localhost:1934'

function App() {
  const { accounts, selectedAcc, onSelectAcc, onAddAccount } = useAccounts()
  // @TODO: WC: this is making us render App twice even if we do not use it
  const { connections, wcConnect, disconnect, userAction } = useWalletConnect({ selectedAcc, chainId: 137 })

  useEffect(() => {
    const query = new URLSearchParams(window.location.href.split('?').slice(1).join('?'))
    const wcUri = query.get('uri')
    if (wcUri) wcConnect({ uri: wcUri })
    // @TODO only on init; perhaps put this in the hook itself

    // @TODO on focus and on user action
    navigator.permissions.query({ name: 'clipboard-read' }).then((result) => {
      // If permission to read the clipboard is granted or if the user will
      // be prompted to allow it, we proceed.

      if (result.state === 'granted' || result.state === 'prompt') {
        navigator.clipboard.readText().then(clipboard => {
          if (clipboard.startsWith('wc:')) wcConnect({ uri: clipboard })
        })
      }
      // @TODO show the err to the user if they triggered the action
    }).catch(() => null)
  }, [])
  
  // hax
  window.wcConnect = uri => wcConnect({ uri })

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

              <select id="networkSelector" defaultValue="Ethereum">
                <option>Ethereum</option>
                <option>Polygon</option>
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
