import './App.css'
// @TODO LoginOrSignup in a separate file
import { useState, useRef } from 'react'

function App() {
  return LoginOrSignup({ onAccRequest: req => console.log(req) })
}

function LoginOrSignup({ onAccRequest }) {
  // @TODO should we init the state somehow?
  // @NOTE: input.setCustomValidity
  // @NOTE: preventDefault prevents validation
  const passConfirmInput = useRef(null)
  const [state, setState] = useState({ email: '', passphrase: '', passphraseConfirm: '' })
  const onSubmit = e => {
    e.preventDefault()
    onAccRequest({ action: 'SIGNUP', accType: 'QUICK', email: state.email, passphrase: state.passphrase })
  }
  const onUpdate = updates => {
    const newState = { ...state, ...updates }
    setState(newState)
    // @TODO translation string
    passConfirmInput.current.setCustomValidity(newState.passphrase !== newState.passphraseConfirm ? 'Passphrase must match' : '')
  }
  return (
    <div className="loginOrSignup">
        <div id="loginEmailPass">
          <form onSubmit={onSubmit}>
            <input type="email" required placeholder="Email" value={state.email} onChange={e => onUpdate({ email: e.target.value })}></input>
            <input type="password" required placeholder="Passphrase" value={state.passphrase} onChange={e => onUpdate({ passphrase: e.target.value })}></input>
            <input ref={passConfirmInput} required type="password" placeholder="Confirm passphrase" value={state.passphraseConfirm} onChange={e => onUpdate({ passphraseConfirm: e.target.value })}></input>
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
