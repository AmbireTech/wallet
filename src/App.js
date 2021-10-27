import './App.css'

import { fetch, fetchCaught, fetchPost } from './lib/fetch'
import { useState } from 'react'
import { useEffect } from 'react'
import {
  HashRouter as Router,
  Switch,
  Route,
  Link,
  Redirect
} from 'react-router-dom'
import { MdDashboard, MdLock, MdCompareArrows } from 'react-icons/md'
import { BsPiggyBank } from 'react-icons/bs'
import LoginOrSignup from './components/LoginOrSignupForm/LoginOrSignupForm'
import EmailLogin from './components/EmailLogin/EmailLogin'
import TrezorConnect from 'trezor-connect'
import { TrezorSubprovider } from '@0x/subproviders/lib/src/subproviders/trezor' // https://github.com/0xProject/0x-monorepo/issues/1400
import { LedgerSubprovider } from '@0x/subproviders/lib/src/subproviders/ledger' // https://github.com/0xProject/0x-monorepo/issues/1400
import { ledgerEthereumBrowserClientFactoryAsync } from '@0x/subproviders/lib/src' // https://github.com/0xProject/0x-monorepo/issues/1400

TrezorConnect.manifest({
  email: 'contactus@ambire.com',
  appUrl: 'https://www.ambire.com'
})

// @TODO consts/cfg
const relayerURL = 'http://localhost:1934'

// @TODO another file
// @TODO err-catching fetch helper
const { generateAddress2 } = require('ethereumjs-util')
const { getProxyDeployBytecode } = require('adex-protocol-eth/js/IdentityProxyDeploy')
const { Wallet } = require('ethers')
const { hexZeroPad, AbiCoder, keccak256, id } = require('ethers').utils


// NOTE: This is a compromise, but we can afford it cause QuickAccs require a secondary key
// Consider more
const SCRYPT_ITERATIONS = 131072/8

const onAccRequest = async req => {
  console.log(req)

  // @TODO url
  // @TODO we can do these fetches in parallel
  const { whitelistedFactories, whitelistedBaseIdentities } = await fetch(`${relayerURL}/relayer/cfg`).then(r => r.json())

  // @TODO proper salt
  const salt = hexZeroPad('0x01', 32)
  const firstKeyWallet = Wallet.createRandom()

  // @TODO fix this hack, use another source of randomness
  // 6 words is 2048**6
  const secondKeySecret = Wallet.createRandom({
    extraEntropy: id(req.email+':'+Date.now())
  }).mnemonic.phrase.split(' ').slice(0, 6).join(' ') + ' ' + req.email
  const secondKeyAddress = await fetchPost(`${relayerURL}/second-key`, { secondKeySecret })
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
  const createResp = await fetchPost(`${relayerURL}/identity/${identityAddr}`, {
    email: req.email,
    primaryKeyBackup: req.backupOptout ? null : primaryKeyBackup,
    secondKeySecret,
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
    // @TODO signer
  }
}
//onAccRequest({ passphrase: 'testtest', email: 'ivo@strem.io' })


// @TODO move this
async function connectWeb3AndGetAccounts () {
  // @TODO: pending state; should bein the LoginORSignup (AddAccount) component
  if (typeof window.ethereum === 'undefined') {
    // @TODO catch this
    throw new Error('MetaMask not available')
  }
  const ethereum = window.ethereum
  const web3Accs = await ethereum.request({ method: 'eth_requestAccounts' })
  return getOwnedByEOAs(web3Accs)
}

async function getOwnedByEOAs(eoas) {
  const allOwnedIdentities = await Promise.all(eoas.map(
    async acc => {
      const resp = await fetch(`${relayerURL}/identity/any/by-owner/${acc}?includeFormerlyOwned=true`)
      return await resp.json()
    }
  ))

  let allUniqueOwned = {}
  // preserve the last truthy priv value
  allOwnedIdentities.forEach(x => 
    Object.entries(x).forEach(
      ([id, priv]) => allUniqueOwned[id] = priv ||  allUniqueOwned[id]
    )
  )

  return await Promise.all(Object.keys(allUniqueOwned).map(getAccountByAddr))
}

async function getAccountByAddr (addr) {
  // @TODO: fundamentally, do we even need these values?
  const { salt, identityFactoryAddr, baseIdentityAddr } = await fetch(`${relayerURL}/identity/${addr}`)
    .then(r => r.json())
  return {
    _id: addr,
    salt, identityFactoryAddr, baseIdentityAddr,
    // @TODO signer for the ones that we CURRENTLY control
  }
}


async function connectTrezorAndGetAccounts () {
  /*
  const engine = new Web3ProviderEngine({ pollingInterval: this.pollingInterval })
  engine.addProvider(new TrezorSubprovider({ trezorConnectClientApi: TrezorConnect, ...this.config }))
  engine.addProvider(new CacheSubprovider())
  engine.addProvider(new RPCSubprovider(this.url, this.requestTimeoutMs))
  */
  const provider = new TrezorSubprovider({ trezorConnectClientApi: TrezorConnect })
  return getOwnedByEOAs(await provider.getAccountsAsync(5))
}

async function connectLedgerAndGetAccounts () {
  const provider = new LedgerSubprovider({
    networkId: 0, // @TODO: is this needed?
    ledgerEthereumClientFactoryAsync: ledgerEthereumBrowserClientFactoryAsync,
    //baseDerivationPath: this.baseDerivationPath
  })
  return getOwnedByEOAs(await provider.getAccountsAsync(5))
}

// @TODO catch parse failures and handle them
const initialAccounts = JSON.parse(localStorage.accounts || '[]')
function App() {
  const [accounts, setAccounts] = useState(initialAccounts)

  const addAccount = acc => {
    console.log('addAccount', acc)
    const existingIdx = accounts.findIndex(x => x._id === acc._id)
    // @TODO show toast
    // the use case for updating the entry is that we have some props (such as which EOA controls it) which migth change
    if (existingIdx === -1) accounts.push(acc)
    else accounts[existingIdx] = acc
    setAccounts(accounts)
    localStorage.accounts = JSON.stringify(accounts)
  }
  const addMultipleAccounts = accs => {
    accs.forEach(addAccount)
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
                <LoginOrSignup onAccRequest={req => onAccRequest(req).then(addAccount)} action="SIGNUP"></LoginOrSignup>
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
                <button onClick={() => connectTrezorAndGetAccounts().then(addMultipleAccounts)}><div className="icon" style={{ backgroundImage: 'url(./resources/trezor.png)' }}/>Trezor</button>
                <button onClick={() => connectLedgerAndGetAccounts().then(addMultipleAccounts)}><div className="icon" style={{ backgroundImage: 'url(./resources/ledger.png)' }}/>Ledger</button>
                <button onClick={() => connectWeb3AndGetAccounts().then(addMultipleAccounts)}><div className="icon" style={{ backgroundImage: 'url(./resources/metamask.png)' }}/>Metamask / Browser</button>
              </div>
            </section>
          </div>
        </Route>

        <Route path="/email-login">
          <EmailLogin relayerURL={relayerURL} onAddAccount={addAccount}></EmailLogin>
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

export default App;
