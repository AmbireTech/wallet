import './App.css';

function App() {
  return LoginContainer()
}

function LoginContainer() {
  return (
    <div className="loginOrSignup">
        <div id="loginEmailPass">
          {/* TODO form validation */}
          <input type="email"></input>
          <input type="password"></input>
          <input type="submit" value="Sign up"></input>
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
