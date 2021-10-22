import './App.css'
// @TODO LoginOrSignup in a separate file
import { useState, useRef } from 'react'

// @TODO another file
// @TODO err-catching fetch helper


const fetch = require('node-fetch')
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
  const { whitelistedFactories, whitelistedBaseIdentities } = await fetch('http://localhost:1934/relayer/cfg').then(r => r.json())

  // @TODO proper salt
  const salt = hexZeroPad('0x01', 32)
  const firstKeyWallet = Wallet.createRandom()

  // @TODO fix this hack, use another source of randomness
  // 6 words is 2048**6
  const secondKeySecret = Wallet.createRandom({
    extraEntropy: id(req.email+':'+Date.now())
  }).mnemonic.phrase.split(' ').slice(0, 6).join(' ') + ' ' + req.email
  const secondKeyAddress = await fetch('http://localhost:1934/second-key', {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({ secondKeySecret })
  }).then(r => r.json()).then(r => r.address)

  // @TODO: timelock value for the quickAccount
  const quickAccount = [600, firstKeyWallet.address, secondKeyAddress]
  const abiCoder = new AbiCoder()
  const accHash = keccak256(abiCoder.encode(['tuple(uint, address, address)'], [quickAccount]))
  // @TODO quickAccManager addr
  const quickAccManager = '0x'
  const privileges = [[quickAccManager, accHash]]
  const identityFactoryAddr = whitelistedFactories[whitelistedFactories.length - 1]
  const baseIdentityAddr = whitelistedBaseIdentities[whitelistedBaseIdentities.length - 1]
  const bytecode = getProxyDeployBytecode(baseIdentityAddr, privileges, { privSlot: 0 })
  const identityAddr = '0x' + generateAddress2(identityFactoryAddr, salt, bytecode).toString('hex')

  // @TODO manage storage outside of this function, figure out what to return
  //let n = Date.now()
  localStorage['account_'+req.email] = await firstKeyWallet.encrypt(req.passphrase, { scrypt: { N: SCRYPT_ITERATIONS } })
  //console.log(encrypted, Date.now() - n)

  /*
  n = Date.now()
  console.log(await Wallet.fromEncryptedJson(encrypted, req.passphrase))
  console.log(Date.now()-n)
  */

  console.log('identityAddr:', identityAddr, quickAccount)
}
onAccRequest({ passphrase: 'testtest', email: 'ivo@strem.io' })

function App() {
  const loginComponent = LoginOrSignup({ onAccRequest })

  return (<div>
    <img src="https://www.ambire.com/ambire-logo-2.png"/>
    {loginComponent}
  </div>)
}
// @TODO remove this bit


function LoginOrSignup({ onAccRequest }) {
  // @NOTE: preventDefault prevents validation
  const passConfirmInput = useRef(null)
  const [state, setState] = useState({ email: '', passphrase: '', passphraseConfirm: '' })
  const onSubmit = e => {
    e.preventDefault()
    onAccRequest({
      action: 'SIGNUP',
      accType: 'QUICK',
      email: state.email,
      passphrase: state.passphrase
    })
  }
  const onUpdate = updates => {
    const newState = { ...state, ...updates }
    setState(newState)
    // @TODO translation string
    passConfirmInput.current.setCustomValidity(
      newState.passphrase !== newState.passphraseConfirm ? 'Passphrase must match' : ''
    )
  }
  return (
    <div className="loginOrSignup">
        <div id="loginEmailPass">
          <form onSubmit={onSubmit}>
            <input type="email" required placeholder="Email" value={state.email} onChange={e => onUpdate({ email: e.target.value })}></input>
            <input type="password" required minLength="8" placeholder="Passphrase" value={state.passphrase} onChange={e => onUpdate({ passphrase: e.target.value })}></input>
            <input ref={passConfirmInput} required minLength="8" type="password" placeholder="Confirm passphrase" value={state.passphraseConfirm} onChange={e => onUpdate({ passphraseConfirm: e.target.value })}></input>
            <input type="submit" value="Sign up"></input>
          </form>
        </div>

        <div id="loginSeparator" style={{ width: '30px' }}>
          <span>or</span>
        </div>

        <div id="loginOthers">
          <button>Ledger</button>
          <button>Trezor</button>
          <button>Metamask or Browser</button>
        </div>
    </div>
  );
}

export default App;
