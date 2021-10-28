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
import Dashboard from './components/Dashboard/Dashboard'

// @TODO consts/cfg
const relayerURL = 'http://localhost:1934'

// @TODO catch parse failures and handle them
const initialAccounts = JSON.parse(localStorage.accounts || '[]')

function App() {
  const [accounts, setAccounts] = useState(initialAccounts)

  const onAddAccount = acc => {
    console.log('onAddAccount', acc)
    const existingIdx = accounts.findIndex(x => x._id === acc._id)
    // @TODO show toast
    // the use case for updating the entry is that we have some props (such as which EOA controls it) which migth change
    if (existingIdx === -1) accounts.push(acc)
    else accounts[existingIdx] = acc

    // need to make a copy, otherwise no rerender
    setAccounts([ ...accounts ])

    localStorage.accounts = JSON.stringify(accounts)

    if (Object.keys(accounts).length) {
      window.location.href = '/#/dashboard'
    }
  }

  const onAccountSelected = ev => {
    accounts.forEach(acc => acc.selected = false)
    accounts.find(x => x._id === ev.target.value).selected = true
    localStorage.accounts = JSON.stringify(accounts)
    setAccounts([ ...accounts ])
  }

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
          <Dashboard accounts={accounts} onAccountSelected={onAccountSelected}></Dashboard>
        </Route>
        <Route path="/security"></Route>
        <Route path="/transactions"></Route>
        <Route path="/swap"></Route>
        <Route path="/earn"></Route>
        {/* TODO: connected dapps */}
        {/* TODO: tx identifier in the URL */}
        <Route path="/approve-tx"></Route>

        <Route path="/">
          { /* TODO: redirect depending on whether we have an acc */ }
          <Redirect to="/add-account" />
        </Route>

      </Switch>
    </Router>
    )
}

export default App;
