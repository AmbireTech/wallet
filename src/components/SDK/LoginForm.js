import React, { useState } from 'react'
import Accounts from "./Accounts";

import { useLocalStorage, useAccounts, usePrivateMode } from 'hooks'

export default function LoginForm({ onAccRequest, inProgress, onLoginSuccess }) {

  // check if the user is logged in.
  // if he is, display his account in a dropdown...
  // that should be OK for now
  const { accounts, selectedAcc, onSelectAcc } = useAccounts(useLocalStorage)
  const { hidePrivateValue } = usePrivateMode(useLocalStorage)

  const [state, setState] = useState({
    email: ''
  })
  const onSubmit = e => {
    e.preventDefault()

    // If the user has added an email, proceed with email login
    if (state.email) {
      onAccRequest({
        email: state.email,
        passphrase: ''
      })
      return
    }

    // if there is a selectedAcc, proceed with it
    if (selectedAcc) {
      onLoginSuccess(selectedAcc)
      return
    }

    // TO DO: ERRORS
  }
  const onUpdate = updates => {
    const newState = { ...state, ...updates }
    setState(newState)
  }

  const signInBtnMsg = selectedAcc
    ? 'Sign In'
    : 'Login with Email'

  return (
    <form onSubmit={onSubmit}>
      {
        accounts.length
          ? (<React.Fragment>
              <Accounts accounts={accounts} selectedAddress={selectedAcc} onSelectAcc={onSelectAcc} hidePrivateValue={hidePrivateValue} />
              <div>OR</div>
            </React.Fragment>)
        : (<></>)
      }
      <input type="email" placeholder="Email" value={state.email} onChange={e => onUpdate({ email: e.target.value })}></input>
      <input type="submit" disabled={inProgress} value={(inProgress ? "Signing in..." : signInBtnMsg)}></input>
    </form>
  )
}