import { useState, useRef } from 'react'
import { Checkbox } from "../common"

export default function LoginOrSignupForm({ action = 'LOGIN', onAccRequest, inProgress }) {
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
        passphrase: state.passphrase,
        backupOptout: state.backupOptout,
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
      if (passConfirmInput.current) {
          passConfirmInput.current.setCustomValidity(invalid ? 'Passwords must match' : '')
      }
    }
    const minPwdLen = 8
    const isSignup = state.action === 'SIGNUP'
    const additionalOnSignup = state.backupOptout ? (
      <Checkbox label="I understand that losing this backup means I will have to trigger account recovery." required={true}></Checkbox>
    ) : (<></>)
    const additionalInputs = isSignup ?
      (<>
        <input
          type="password"
          required
          minLength={minPwdLen}
          placeholder="Password"
          value={state.passphrase}
          onChange={e => onUpdate({ passphrase: e.target.value })}
        ></input>
        <input
          ref={passConfirmInput}
          required
          minLength={minPwdLen}
          type="password"
          placeholder="Confirm password"
          value={state.passphraseConfirm}
          onChange={e => onUpdate({ passphraseConfirm: e.target.value })}></input>
        <Checkbox label="I agree to to the Terms of Use and Privacy policy." required={true}></Checkbox>
        <Checkbox label="Backup on Ambire Cloud." checked={!state.backupOptout} onChange={e => onUpdate({ backupOptout: !e.target.checked })}></Checkbox>
        {additionalOnSignup}
      </>) : (<></>)

    return (
      <form onSubmit={onSubmit}>
        <input type="email" required placeholder="Email" value={state.email} onChange={e => onUpdate({ email: e.target.value })}></input>
        {
          // Trick the password manager into putting in the email
          !isSignup ? (<input type="password" style={{ display: "none" }}></input>): (<></>)
        }
        {additionalInputs}
        <input type="submit" disabled={inProgress} value={isSignup ?
          (inProgress ? "Signing up..." : "Sign up")
          : (inProgress ? "Logging in..." : "Log in")}></input>
      </form>
    )
}
