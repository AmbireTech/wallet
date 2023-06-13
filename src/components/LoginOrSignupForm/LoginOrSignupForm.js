import { useState, useRef } from 'react'

import { useModals } from 'hooks'
import { WeakPasswordModal } from 'components/Modals'
import { checkHaveIbeenPwned } from 'components/AddAccount/passwordChecks'
import AddAccountForm from 'components/AddAccount/Form/Form'
import { Button } from 'components/common'
import useCheckPasswordStrength from 'hooks/useCheckPasswordStrength'

export default function LoginOrSignupForm({ action = 'LOGIN', onAccRequest, inProgress }) {
  const { showModal } = useModals()

  const passConfirmInput = useRef(null)
  const passInput = useRef(null)
  const [state, setState] = useState({
    email: '',
    passphrase: '',
    passphraseConfirm: '',
    action
  })
  const { passwordStrength, arePasswordsMatching } = useCheckPasswordStrength(state)

  const isSignup = state.action === 'SIGNUP'

  const handleRegister = () => {
    onAccRequest({
      action: state.action,
      accType: 'QUICK',
      email: state.email,
      passphrase: state.passphrase,
      backupOptout: state.backupOptout
    })
  }

  const onSubmit = async (e) => {
    e.preventDefault()

    const breached = await checkHaveIbeenPwned(state.passphrase)

    if (breached) {
      showModal(<WeakPasswordModal onContinueAnyway={handleRegister} />)
      return
    }

    handleRegister()
  }

  const onUpdate = (updates) => {
    const newState = { ...state, ...updates }
    setState(newState)
    const shouldValidate = newState.action === 'SIGNUP'
    // @Todo: Split logic and markup for Login and Add Account
    if (shouldValidate) {
      const invalid = newState.passphrase !== newState.passphraseConfirm

      // If the password is invalid, set a custom validity message
      if (!passwordStrength.satisfied) {
        passInput.current.setCustomValidity(
          'Make sure that your password is at least 8 characters long and contains at least one number and one letter.'
        )
      }
      passInput.current.setCustomValidity('')

      // @TODO translation string
      if (passConfirmInput.current) {
        passConfirmInput.current.setCustomValidity(invalid ? 'Passwords must match' : '')
      }
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <input
        type="email"
        required
        placeholder="Email"
        value={state.email}
        onChange={(e) => onUpdate({ email: e.target.value })}
      />
      {
        // Trick the password manager into putting in the email
        !isSignup ? (
          <input type="password" style={{ display: 'none' }} />
        ) : (
          <AddAccountForm
            state={state}
            onUpdate={onUpdate}
            passInput={passInput}
            passConfirmInput={passConfirmInput}
            passwordStrength={passwordStrength}
            arePasswordsMatching={arePasswordsMatching}
          />
        )
      }
      <Button
        type="submit"
        variant="primaryGradient"
        loading={inProgress}
        loadingText={isSignup ? 'Signing Up...' : 'Logging In...'}
        disabled={
          !state.email?.length ||
          (isSignup && (!arePasswordsMatching || !passwordStrength.satisfied))
        }
      >
        {isSignup ? 'Sign Up' : 'Log In'}
      </Button>
    </form>
  )
}
