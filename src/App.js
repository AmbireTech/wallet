import './App.css'

import { useEffect } from 'react'
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
import useWalletConnect from './hooks/walletconnect'

// @TODO consts/cfg
const relayerURL = 'http://localhost:1934'

function App() {
  const { selectedAcc, onAddAccount } = useAccounts()
  // @TODO: WC: this is making us render App twice even if we do not use it
  const { wcConnect } = useWalletConnect({ selectedAcc, chainId: 137 })

  useEffect(() => {
    const query = new URLSearchParams(window.location.href.split('?').slice(1).join('?'))
    const wcUri = query.get('uri')
    if (wcUri) wcConnect({ uri: wcUri })
    // @TODO only on init; perhaps put this in the hook itself

    // @TODO on focus and on user action
    const clipboardError = e => console.log('non-fatal clipboard err', e)
    navigator.permissions.query({ name: 'clipboard-read' }).then((result) => {
      // If permission to read the clipboard is granted or if the user will
      // be prompted to allow it, we proceed.

      if (result.state === 'granted' || result.state === 'prompt') {
        navigator.clipboard.readText().then(clipboard => {
          if (clipboard.startsWith('wc:')) wcConnect({ uri: clipboard })
        }).catch(clipboardError)
      }
      // @TODO show the err to the user if they triggered the action
    }).catch(clipboardError)
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

        <Route path="/platform" component={Platform}></Route>

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
