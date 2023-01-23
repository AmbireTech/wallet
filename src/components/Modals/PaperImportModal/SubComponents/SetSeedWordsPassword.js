import accountPresets from 'ambire-common/src/constants/accountPresets'
import { Button, TextInput } from 'components/common'
import { useRef, useEffect, useState, useCallback } from 'react'
import { validateImportedAccountProps } from 'lib/validations/importedAccountValidations'

import styles from './SubComponents.module.scss'

const SetSeedWordsPassword = ({ wallet, setError, onAddAccount, hideModal, retrievedIdentity, setModalButtons }) => {

  const [passphrase, setPassphrase] = useState('')
  const [passphrase2, setPassphrase2] = useState('')

  const textFieldRef = useRef()

  const onValidate = useCallback(async () => {

    if (passphrase.length < 8) {
      setError('Passphrase should be at least 8 characters')
      return
    }

    if (passphrase !== passphrase2) {
      setError('Passphrases are not matching')
      return
    }

    const primaryKeyBackup = JSON.stringify(
      await wallet.encrypt(passphrase, accountPresets.encryptionOpts)
    )

    const account = {
      ...retrievedIdentity,
      primaryKeyBackup,
      backupOptout: false,
      emailConfRequired: false
      // cloudBackupOptout: TODO : where do we find this data?
    }

    const validatedFile = validateImportedAccountProps(account)

    if (validatedFile.success) {
      onAddAccount(account, { select: true })
      hideModal()
    } else {
      setError(validatedFile.message)
    }

  }, [passphrase, passphrase2, wallet, retrievedIdentity, setError, onAddAccount, hideModal])

  useEffect(() => {
    setTimeout(() => {
      textFieldRef?.current?.focus()
    }, 100)
  }, [])

  useEffect(() => {
    setModalButtons([
      <Button
        full
        className={styles.button}
        onClick={onValidate}>
        Update account
      </Button>
    ])
  }, [onValidate, setModalButtons])

  return (
    <>
      <div className={styles.instructions}>
        Secure your Ambire account with a password
      </div>

      <TextInput password
                 className='mb-2'
                 ref={textFieldRef}
                 onChange={(v) => setPassphrase(v)}
                 placeholder='Password'/>

      <TextInput password
                 onChange={(v) => setPassphrase2(v)}
                 placeholder='Repeat password'/>

    </>
  )
}

export default SetSeedWordsPassword
