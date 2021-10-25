import './App.css'

import { useState } from 'react'
import {
  HashRouter as Router,
  Switch,
  Route,
  Link,
  Redirect
} from 'react-router-dom'
import { MdDashboard, MdLock, MdCompareArrows, MdEmail } from 'react-icons/md'
import { BsPiggyBank } from 'react-icons/bs'
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

  // @TODO catch errors here - wrong status codes, etc.
  const createResp = await fetchPost(`http://localhost:1934/identity/${identityAddr}`, {
    email: req.email,
    primaryKeyBackup, secondKeySecret,
    salt, identityFactoryAddr, baseIdentityAddr,
    privileges
  })

  // @TODO remove this
  console.log('identityAddr:', identityAddr, quickAccount, createResp)

  return {
    _id: identityAddr,
    email: req.email,
    primaryKeyBackup,
    salt, identityFactoryAddr, baseIdentityAddr,
  }
}
//onAccRequest({ passphrase: 'testtest', email: 'ivo@strem.io' })

// @TODO catch parse failures and handle them
const initialAccounts = JSON.parse(localStorage.accounts || '[]')
function App() {
  const [accounts, setAccounts] = useState(initialAccounts)
  const addAccount = acc => {
    console.log('addAccount', acc)
    const existing = accounts.find(x => x._id === acc._id)
    // @TODO show toast
    if (existing) return
    const newAccs = [ ...accounts, acc ]
    setAccounts(newAccs)
    localStorage.accounts = JSON.stringify(newAccs)
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
          <LoginByEmail onAddAccount={addAccount}></LoginByEmail>
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

function LoginByEmail({ onAddAccount }) {
  const [requiresEmailConfFor, setRequiresConfFor] = useState('')
  const [err, setErr] = useState('')

  const onTryDecrypt = async (identityInfo, passphrase) => {
    if (!identityInfo.meta.primaryKeyBackup) {
      setErr('No account key backup: you either disabled email login or you have to import it from JSON')
      return
    }
    // @TODO progress bar here
    try {
      console.log(await Wallet.fromEncryptedJson(JSON.parse(identityInfo.meta.primaryKeyBackup), passphrase))
      const { _id, salt, identityFactoryAddr, baseIdentityAddr } = identityInfo
      onAddAccount({
        _id,
        email: identityInfo.meta.email,
        primaryKeyBackup: identityInfo.meta.primaryKeyBackup,
        salt, identityFactoryAddr, baseIdentityAddr
      })
    } catch (e) {
      if (e.message.includes('invalid password')) setErr('Invalid passphrase')
      else {
        setErr(`Ethers error: ${e.message}`)
        console.error(e)
      }
    }

  }

  const onLogin = async ({ email, passphrase }) => {
    setErr('')
    setRequiresConfFor('')
    // try by-email first: if this returns data we can just move on to decrypting
    // does not matter which network we request
    const resp = await fetch(`http://localhost:1934/identity/by-email/${encodeURIComponent(email)}/ethereum?skipPrivilegesUpdate=true`, { credentials: 'include' })
    let body
    try {
      body = await resp.json()
    } catch(e) {
      console.error(e)
      setErr(`Unexpected error: ${resp.status}, ${e && e.message}`)
      return
    }
  
    if (resp.status === 401 && body.errType === 'UNAUTHORIZED') {
      const requestAuthResp = await fetch(`http://localhost:1934/identity/by-email/${encodeURIComponent(email)}/request-confirm-login`, { method: 'POST' })
      if (requestAuthResp.status !== 200) {
        setErr(`Email confirmation needed but unable to request: ${requestAuthResp.status}`)
        return
      }
      setRequiresConfFor(email)
      return
    }

    if (resp.status === 404 && body.errType === 'DOES_NOT_EXIST') {
      setErr('Account does not exist')
      return
    }

    if (resp.status === 200) {
      onTryDecrypt(body, passphrase)
    } else {
      setErr(body.message ? `Relayer error: ${body.message}` : `Unknown no-message error: ${resp.status}`)
    }
  }

  const inner = requiresEmailConfFor ?
    (<div id="loginEmail" className="emailConf">
      <h3><MdEmail size={25} color="white"/>Email confirmation required</h3>
      <p>This is the first log-in from this browser, email confirmation is required.<br/><br/>
      We sent an email to {requiresEmailConfFor}, please check your inbox and click "Confirm".
      </p>
    </div>)
    : (<div id="loginEmail">
      <LoginOrSignup onAccRequest={onLogin}></LoginOrSignup>

      {err ? (<p className="error">{err}</p>) : (<></>)}

      <a href="#">I forgot my passphrase</a>
      <a href="#">Import JSON</a>
    </div>)
    
    return (
    <section className="loginSignupWrapper" id="emailLoginSection">
    <div id="logo"/>
    {inner}
  </section>
  )
}

export default App;
