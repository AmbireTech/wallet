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
let initialSelectedAcc = localStorage.selectedAcc
if (!initialSelectedAcc || !initialAccounts.find(x => x._id === initialSelectedAcc)) {
  initialSelectedAcc = initialAccounts[0] ? initialAccounts[0]._id : ''
}

function App() {
  // @TODO separate hook: useAccounts
  const [accounts, setAccounts] = useState(initialAccounts)
  const [selectedAcc, setSelectedAcc] = useState(initialSelectedAcc)

  const onSelectAcc = selected => {
    localStorage.selectedAcc = selected
    setSelectedAcc(selected)
  }
  const onAddAccount = (acc, opts) => {
    console.log('onAddAccount', acc)
    const existingIdx = accounts.findIndex(x => x._id.toLowerCase() === acc._id.toLowerCase())

    // @TODO show toast
    // the use case for updating the entry is that we have some props (such as which EOA controls it) which migth change
    if (existingIdx === -1) accounts.push(acc)
    else accounts[existingIdx] = acc

    // need to make a copy, otherwise no rerender
    setAccounts([ ...accounts ])

    localStorage.accounts = JSON.stringify(accounts)

    if (opts.select) onSelectAcc(acc._id)
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
              {/* TODO more elegant way to manage selected? */}
              <select id="accountSelector" onChange={ ev => onSelectAcc(ev.target.value) } defaultValue={selectedAcc}>
                {accounts.map(acc => (<option key={acc._id}>{acc._id}</option>))}
              </select>

              <select id="networkSelector" defaultValue="Ethereum">
                <option>Ethereum</option>
                <option>Polygon</option>
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
