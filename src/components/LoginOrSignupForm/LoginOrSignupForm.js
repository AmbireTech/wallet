import styles from './LoginOrSignupForm.module.scss'
import { useState, useRef } from 'react'
import accountPresets from 'ambire-common/src/constants/accountPresets'
import { Checkbox } from "components/common"
import { ethers } from "ethers"

import WEAK_PASSWORDS from 'ambire-common/src/constants/commonPasswords.json'

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
      const invalid = shouldValidate && (
        newState.passphrase !== newState.passphraseConfirm
      )

      const passwordStrengthFeedback = passwordStrength(newState.passphrase)

      passInput.current.setCustomValidity(passwordStrengthFeedback.error || '')

      // @TODO translation string
      if (passConfirmInput.current) {
          passConfirmInput.current.setCustomValidity(invalid ? 'Passwords must match' : '')
      }
    }
    const minPwdLen = 8
    const isSignup = state.action === 'SIGNUP'
    const days = Math.ceil(accountPresets.quickAccTimelock / 86400)
    const noBackupDisclaimer = `In case you forget your password or lose your backup, you will have to wait ${days} days and pay the recovery fee to restore access to your account.`
    const additionalOnSignup = state.backupOptout ? (
      <Checkbox label={noBackupDisclaimer} required={true}></Checkbox>
    ) : (<></>)
    const Link = ({ href, children }) => (<a href={href} target='_blank' rel='noreferrer' onClick={e => e.stopPropagation()}>{children}</a>)
    const additionalInputs = isSignup ?
      (<>
        <div className='passwordHolder'>
          <input
            type="password"
            ref={passInput}
            required
            minLength={minPwdLen}
            placeholder="Password"
            value={state.passphrase}
            onChange={e => onUpdate({ passphrase: e.target.value })}
          ></input>
          {
            !!state.passphrase.length &&
            <div className='password-strength'>
              <div className={`password-strength-progress password-strength-progress-${passwordStrength(state.passphrase).strength}`}></div>
            </div>
          }
        </div>
        <input
          ref={passConfirmInput}
          required
          minLength={minPwdLen}
          type="password"
          placeholder="Confirm password"
          value={state.passphraseConfirm}
          onChange={e => onUpdate({ passphraseConfirm: e.target.value })}></input>
        <Checkbox
          labelClassName={styles.checkboxLabel}
          label={<>I agree to the <Link href='https://www.ambire.com/Ambire%20ToS%20and%20PP%20(26%20November%202021).pdf'>Terms of Service and Privacy policy</Link>.</>}
          required={true}
        ></Checkbox>
        <Checkbox
          labelClassName={styles.checkboxLabel}
          label={<>Backup on <Link href='https://help.ambire.com/hc/en-us/articles/4410892186002-What-is-Ambire-Cloud-'>Ambire Cloud</Link>.</>}
          checked={!state.backupOptout}
          onChange={e => onUpdate({ backupOptout: !e.target.checked })}
        ></Checkbox>
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
          (inProgress ? "Signing up..." : "Sign Up")
          : (inProgress ? "Logging in..." : "Log In")}></input>
      </form>
    )
}
