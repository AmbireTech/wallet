import { useState } from 'react'
import cn from 'classnames'
import accountPresets from 'ambire-common/src/constants/accountPresets'

import { ReactComponent as XIcon } from 'resources/icons/x.svg'
import { ReactComponent as CheckIcon } from 'resources/icons/check.svg'

import { Checkbox } from 'components/common'

import styles from './Form.module.scss'

const minPwdLen = 8
const days = Math.ceil(accountPresets.quickAccTimelock / 86400)
const Link = ({ href, children }) => (
  <a href={href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
    {children}
  </a>
)

const onFocusOrUnfocus = (e, setIsFocused, state) => {
  if (e.currentTarget === e.target) {
    setIsFocused(state)
  }
}

export default function AddAccountForm({
  state,
  onUpdate,
  passInput,
  passConfirmInput,
  passwordStrength,
  arePasswordsMatching
}) {
  const [isFocused, setIsFocused] = useState(false)
  const hasPassword = state.passphrase?.length > 0

  return (
    <>
      <div className={styles.passwordInputWrapper}>
        <input
          className={cn(styles.passwordInput, {
            [styles.error]: hasPassword && !passwordStrength.satisfied
          })}
          type="password"
          ref={passInput}
          required
          minLength={minPwdLen}
          placeholder="Password"
          value={state.passphrase}
          onChange={(e) => onUpdate({ passphrase: e.target.value })}
          onFocus={(e) => onFocusOrUnfocus(e, setIsFocused, true)}
          onBlur={(e) => onFocusOrUnfocus(e, setIsFocused, false)}
        />
        <div
          className={cn(styles.passwordStrength, { [styles.visible]: hasPassword && isFocused })}
        >
          {passwordStrength.checks.map((check) => (
            <div key={check.id} className={styles.check}>
              {check.satisfied ? (
                <CheckIcon className={styles.checkIcon} />
              ) : (
                <XIcon className={styles.xIcon} />
              )}
              <span className={styles.checkLabel}>{check.label}</span>
            </div>
          ))}
        </div>
      </div>
      <input
        ref={passConfirmInput}
        required
        minLength={minPwdLen}
        type="password"
        placeholder="Confirm password"
        value={state.passphraseConfirm}
        onChange={(e) => onUpdate({ passphraseConfirm: e.target.value })}
        className={cn(styles.confirmPassword, {
          [styles.error]: hasPassword && (!passwordStrength.satisfied || !arePasswordsMatching)
        })}
        onFocus={(e) => onFocusOrUnfocus(e, setIsFocused, true)}
        onBlur={(e) => onFocusOrUnfocus(e, setIsFocused, false)}
      />
      <Checkbox
        labelClassName={styles.checkboxLabel}
        label={
          <>
            I agree to the{' '}
            <Link href="https://www.ambire.com/Ambire%20ToS%20and%20PP%20(26%20November%202021).pdf">
              Terms of Service and Privacy policy
            </Link>
            .
          </>
        }
        required
      />
      <Checkbox
        labelClassName={styles.checkboxLabel}
        label={
          <>
            Backup on{' '}
            <Link href="https://help.ambire.com/hc/en-us/articles/4410892186002-What-is-Ambire-Cloud-">
              Ambire Cloud
            </Link>
            .
          </>
        }
        checked={!state.backupOptout}
        onChange={(e) => onUpdate({ backupOptout: !e.target.checked })}
      />
      {state.backupOptout ? (
        <Checkbox
          label={`In case you forget your password or lose your backup, you will have to wait ${days} days and pay the recovery fee to restore access to your account.`}
          required
        />
      ) : null}
    </>
  )
}
