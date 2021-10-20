import './App.css';

// @TODO styled components?

function App() {
  return (
    <div className="login">
        <div id="loginEmailPass">
          {/* TODO form validation */}
          <input type="email"></input>
          <input type="password"></input>
        </div>

        <div id="loginSeparator">
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
