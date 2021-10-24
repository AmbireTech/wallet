import './App.css'
import { useState, useRef } from 'react'


import {
  HashRouter as Router,
  Switch,
  Route,
  Link,
  Redirect
} from "react-router-dom"

import Checkbox from "./components/Checkbox/Checkbox"

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

function App() {
  // @TODO default page
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
          <section id="addAccount">
            <div id="loginEmailPass">
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
        </Route>

        <Route path="/email-login">
          <section>
            <div id="loginEmailPass">
              <LoginOrSignup onAccRequest={onAccRequest}></LoginOrSignup>
            </div>
          </section>
        </Route>

        <Route path="/dashboard">
          <img src="https://www.ambire.com/ambire-logo-2.png" alt="ambire logo"/>

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


function LoginOrSignup({ action = 'LOGIN', onAccRequest }) {
  const passConfirmInput = useRef(null)
  const [state, setState] = useState({
    email: '', passphrase: '', passphraseConfirm: '', action
  })
  const onSubmit = e => {
    e.preventDefault()
    onAccRequest({
      action: state.action,
      accType: 'QUICK',
      email: state.email,
      passphrase: state.passphrase
    })
  }
  const onUpdate = updates => {
    const newState = { ...state, ...updates }
    setState(newState)
    const shouldValidate = newState.action === 'SIGNUP'
    const invalid = shouldValidate && (
      newState.passphrase !== newState.passphraseConfirm
    )
    // @TODO translation string
    if (passConfirmInput.current) passConfirmInput.current.setCustomValidity(invalid ? 'Passphrase must match' : '')
  }
  const minPwdLen = 8
  const isSignup = state.action === 'SIGNUP'
  const additionalInputs = isSignup ?
    (<>
      <input
        ref={passConfirmInput}
        required
        minLength={minPwdLen}
        type="password"
        placeholder="Confirm passphrase"
        value={state.passphraseConfirm}
        onChange={e => onUpdate({ passphraseConfirm: e.target.value })}></input>
      <Checkbox label="I agree to to the Terms of Use and Privacy policy." required={true}></Checkbox>
    </>) : (<></>)
  return (
    <form onSubmit={onSubmit}>
      <input type="email" required placeholder="Email" value={state.email} onChange={e => onUpdate({ email: e.target.value })}></input>
      <input type="password" required minLength={minPwdLen} placeholder="Passphrase" value={state.passphrase} onChange={e => onUpdate({ passphrase: e.target.value })}></input>
      {additionalInputs}
      <input type="submit" value={isSignup ? "Sign up" : "Login"}></input>
    </form>
  );
}

export default App;
