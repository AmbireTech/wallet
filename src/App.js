import './App.css';

// @TODO styled components?
import styled from "styled-components";

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 800px;
`

function App() {
  return (
    <LoginContainer className="login">
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
    </LoginContainer>
  );
}

export default App;
