import './App.css'
import { useState } from 'react'

function App() {
  return LoginContainer()
}

function LoginContainer() {
  // @TODO should we init the state somehow?
  // @NOTE: input.setCustomValidity
  // @NOTE: preventDefault prevents validation
  const [state, setState] = useState({ email: '', passphrase: '', passphraseConfirm: '' })
  return (
    <div className="loginOrSignup">
        <div id="loginEmailPass">
          <form onSubmit={e => { console.log(state); e.preventDefault(); e.target.checkValidity(); e.target.reportValidity(); }}>
            <input type="email" placeholder="Email" value={state.email} onChange={e => setState({ ...state, email: e.target.value })}></input>
            <input type="password" placeholder="Passphrase" value={state.passphrase} onChange={e => setState({ ...state, passphrase: e.target.value })}></input>
            <input type="password" placeholder="Confirm passphrase" value={state.passphraseConfirm} onChange={e => setState({ ...state, passphraseConfirm: e.target.value })}></input>
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
