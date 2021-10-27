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
    setAccounts(accounts)
    localStorage.accounts = JSON.stringify(accounts)

    if (Object.keys(accounts).length) {
      window.location.href = '/#/dashboard'
    }
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

            <div>
              <select id="accountSelector">
                {accounts.map(acc => (<option key={acc._id} selected={acc.selected}>{acc._id}</option>))}
              </select>
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
          { /* TODO: redirect depending on whether we have an acc */ }
          <Redirect to="/add-account" />
        </Route>

      </Switch>
    </Router>
    )
}

export default App;
