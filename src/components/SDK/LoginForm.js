import { useState } from 'react'
import Accounts from "./Accounts";

import { useLocalStorage, useAccounts, usePrivateMode } from 'hooks'

export default function LoginForm({ onAccRequest, inProgress }) {

    // check if the user is logged in.
    // if he is, display his account in a dropdown...
    // that should be OK for now
    const { accounts, selectedAcc, onSelectAcc } = useAccounts(useLocalStorage)
    const { hidePrivateValue } = usePrivateMode(useLocalStorage)

    const [state, setState] = useState({
      email: '', passphrase: '', passphraseConfirm: ''
    })
    const onSubmit = e => {
      e.preventDefault()
      onAccRequest({
        accType: 'QUICK',
        email: state.email,
        passphrase: state.passphrase,
        backupOptout: state.backupOptout,
      })
    }
    const onUpdate = updates => {
      const newState = { ...state, ...updates }
      setState(newState)
    }

    return (
      <form onSubmit={onSubmit}>
        {
          accounts.length
            ? (<Accounts accounts={accounts} selectedAddress={selectedAcc} onSelectAcc={onSelectAcc} hidePrivateValue={hidePrivateValue} />)
          : (<></>)
        }
        <div>OR</div>
        <input type="email" required placeholder="Email" value={state.email} onChange={e => onUpdate({ email: e.target.value })}></input>
        <input type="submit" disabled={inProgress} value={(inProgress ? "Logging in..." : "Log In")}></input>
      </form>
    )
}
