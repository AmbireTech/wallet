import './App.css'

import { useState } from 'react'
import {
  HashRouter as Router,
  Switch,
  Route,
  Link,
  Redirect
} from 'react-router-dom'
import { MdDashboard } from 'react-icons/md'
import LoginOrSignup from './components/LoginOrSignup/LoginOrSignup'

// @TODO another file
// @TODO err-catching fetch helper
const fetch = require('node-fetch')
const { generateAddress2 } = require('ethereumjs-util')
const { getProxyDeployBytecode } = require('adex-protocol-eth/js/IdentityProxyDeploy')
const { Wallet } = require('ethers')
const { hexZeroPad, AbiCoder, keccak256, id } = require('ethers').utils

async function fetchPost (url, body) {
	const r = await fetch(url, {
		headers: { 'content-type': 'application/json' },
		method: 'POST',
		body: JSON.stringify(body)
	})
	return r.json()
}

// NOTE: This is a compromise, but we can afford it cause QuickAccs require a secondary key
// Consider more
const SCRYPT_ITERATIONS = 131072/8

const onAccRequest = async req => {
  console.log(req)

  // @TODO url
  // @TODO we can do these fetches in parallel
  const { whitelistedFactories, whitelistedBaseIdentities } = await fetch('http://localhost:1934/relayer/cfg').then(r => r.json())

  // @TODO proper salt
  const salt = hexZeroPad('0x01', 32)
  const firstKeyWallet = Wallet.createRandom()

  // @TODO fix this hack, use another source of randomness
  // 6 words is 2048**6
  const secondKeySecret = Wallet.createRandom({
    extraEntropy: id(req.email+':'+Date.now())
  }).mnemonic.phrase.split(' ').slice(0, 6).join(' ') + ' ' + req.email
  const secondKeyAddress = await fetchPost('http://localhost:1934/second-key', { secondKeySecret })
    .then(r => r.address)

  // @TODO: timelock value for the quickAccount
  const quickAccount = [600, firstKeyWallet.address, secondKeyAddress]
  const abiCoder = new AbiCoder()
  const accHash = keccak256(abiCoder.encode(['tuple(uint, address, address)'], [quickAccount]))
  // @TODO not hardcoded
  const quickAccManager = '0x697d866d20a8E8886a0D0511e82846AC108Bc5B6'
  const privileges = [[quickAccManager, accHash]]
  const identityFactoryAddr = whitelistedFactories[whitelistedFactories.length - 1]
  const baseIdentityAddr = whitelistedBaseIdentities[whitelistedBaseIdentities.length - 1]
  const bytecode = getProxyDeployBytecode(baseIdentityAddr, privileges, { privSlot: 0 })
  const identityAddr = '0x' + generateAddress2(identityFactoryAddr, salt, bytecode).toString('hex')

  const primaryKeyBackup = JSON.stringify(
    await firstKeyWallet.encrypt(req.passphrase, { scrypt: { N: SCRYPT_ITERATIONS } })
  )

  const createResp = await fetchPost(`http://localhost:1934/identity/${identityAddr}`, {
    primaryKeyBackup, secondKeySecret,
    email: req.email,
    salt, identityFactoryAddr, baseIdentityAddr, privileges
  })

  console.log('identityAddr:', identityAddr, quickAccount, createResp)
}
//onAccRequest({ passphrase: 'testtest', email: 'ivo@strem.io' })

// @TODO catch parse failures and handle them
const initialAccounts = JSON.parse(localStorage.accounts || '[]')
function App() {
  const [accounts, setAccounts] = useState(initialAccounts)
  const addAccount = acc => {
    const existing = accounts.find(x => x._id === acc._id)
    // @TODO show toast
    if (existing) return
    setAccounts([ ...accounts, acc ])
    localStorage.accounts = JSON.stringify(accounts)
  }
  return (
    <Router>
      {/*<nav>
          <ul>
            <li>
              <Link to="/email-login">Login</Link>
            </li>
            <li>
              <Link to="/add-account">Signup</Link>
            </li>
          </ul>
      </nav>*/}

      <Switch>
        <Route path="/add-account">
          <div className="loginSignupWrapper">
            <div id="logo"/>
            <section id="addAccount">
              <div id="loginEmail">
                <h3>Create a new account</h3>
                <LoginOrSignup onAccRequest={onAccRequest} action="SIGNUP"></LoginOrSignup>
              </div>

              <div id="loginSeparator">
                <div className="verticalLine"></div>
                <span>or</span>
                <div className="verticalLine"></div>
              </div>

              <div id="loginOthers">
                <h3>Add an existing account</h3>
                <Link to="/email-login">
                  <button><div className="icon" style={{ backgroundImage: 'url(./resources/envelope.png)' }}/>Email</button>
                </Link>
                <button><div className="icon" style={{ backgroundImage: 'url(./resources/trezor.png)' }}/>Trezor</button>
                <button><div className="icon" style={{ backgroundImage: 'url(./resources/ledger.png)' }}/>Ledger</button>
                <button><div className="icon" style={{ backgroundImage: 'url(./resources/metamask.png)' }}/>Metamask / Browser</button>
              </div>
            </section>
          </div>
        </Route>

        <Route path="/email-login">
          <section className="loginSignupWrapper" id="emailLoginSection">
            <div id="logo"/>
            {false ? (<div id="loginEmail" class="emailConf"><h3>Email confirmation required</h3><p>This is the first log-in from this browser, email confirmation is required.<br/><br/>We sent an email to EMAIL, please check your inbox and click "Confirm".</p></div>) : (<div id="loginEmail">
              <LoginOrSignup onAccRequest={onAccRequest}></LoginOrSignup>

              <a href="#">I forgot my passphrase</a>
              <a href="#">Import JSON</a>
            </div>)}
          </section>
        </Route>

        <Route path="/dashboard">
          <div id="logo"/>
          <div><MdDashboard/></div>
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
// @TODO remove this bit

export default App;
