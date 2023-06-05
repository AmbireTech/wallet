import passwordChecks from 'components/AddAccount/passwordChecks'
import { useEffect, useState } from 'react'

const useCheckPasswordStrength = ({ passphrase, passphraseConfirm }) => {
  const [passwordStrength, setPasswordStrength] = useState({
    checks: passwordChecks,
    satisfied: false
  })

  useEffect(() => {
    setPasswordStrength((prev) => ({
      satisfied: prev.checks.every((check) => check.check(passphrase, passphraseConfirm)),
      checks: prev.checks.map((check) => ({
        ...check,
        satisfied: check.check(passphrase, passphraseConfirm)
      }))
    }))
  }, [passphrase, passphraseConfirm])

  return {
    passwordStrength,
    arePasswordsMatching: passphrase === passphraseConfirm
  }
}

export default useCheckPasswordStrength
