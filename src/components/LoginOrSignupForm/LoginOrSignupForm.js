import { useState, useRef } from 'react'
import { ethers } from "ethers"
import WEAK_PASSWORDS from 'ambire-common/src/constants/commonPasswords.json'

import AddAccountForm from 'components/AddAccount/Form/Form'

export default function LoginOrSignupForm({ action = 'LOGIN', onAccRequest, inProgress }) {
    const passConfirmInput = useRef(null)
    const passInput = useRef(null)
    const [state, setState] = useState({
      email: '', passphrase: '', passphraseConfirm: '', action
    })

    const passwordStrength = (passphrase) => {
      let strength = 0
      let passwordError = ''
      if (state.passphrase.length >= 8) {
        strength += 1
        if (passphrase.match(/\d/)) strength += 1
        if (passphrase.match(/[a-z]/)) strength += 1
        if (passphrase.match(/[A-Z]/)) strength += 1
        if (passphrase.match(/[@_.,+;()[\]-]/)) strength += 1
  
        if (strength < 3) {
          passwordError = 'Password too weak. Include Uppercase, lowercase letters, numbers and special characters'
        }
      } else if (!!passphrase.length) {
        strength += 1
        passwordError = 'Password should be 8 characters minimum'
      }
  
      if (WEAK_PASSWORDS.includes(ethers.utils.ripemd160(ethers.utils.toUtf8Bytes(passphrase)))) {
        passwordError = 'This password is too common'
        strength = 1
      }
  
      return {
        strength,
        error: passwordError
      }
    }

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
      // @Todo: Split logic and markup for Login and Add Account
      if (shouldValidate) {
        const invalid = newState.passphrase !== newState.passphraseConfirm
  
        const passwordStrengthFeedback = passwordStrength(newState.passphrase)
  
        passInput.current.setCustomValidity(passwordStrengthFeedback.error || '')
  
        // @TODO translation string
        if (passConfirmInput.current) {
            passConfirmInput.current.setCustomValidity(invalid ? 'Passwords must match' : '')
        }
      }
    }

    const isSignup = state.action === 'SIGNUP'

    return (
      <form onSubmit={onSubmit}>
        <input type="email" required placeholder="Email" value={state.email} onChange={e => onUpdate({ email: e.target.value })}></input>
        {
				// Trick the password manager into putting in the email
				!isSignup ? (
					<input type="password" style={{ display: 'none' }}></input>
				) : (
					<AddAccountForm
            state={state}
            onUpdate={onUpdate}
            passInput={passInput}
            passConfirmInput={passConfirmInput}
            passwordStrength={passwordStrength}
          />
				)
			}
        <input type="submit" disabled={inProgress} value={isSignup ?
          (inProgress ? "Signing up..." : "Sign Up")
          : (inProgress ? "Logging in..." : "Log In")}></input>
      </form>
    )
}
