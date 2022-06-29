import accountPresets from 'consts/accountPresets'
import { Button, TextInput } from 'components/common'
import { useRef, useEffect, useState, useCallback } from 'react'
import { validateImportedAccountProps } from 'lib/validations/importedAccountValidations'

const SetSeedWordsPassword = ({ selectedAccount, wallet, setError, onAddAccount, hideModal }) => {

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
      ...selectedAccount,
      primaryKeyBackup
    }

    const validatedFile = validateImportedAccountProps(account)

    if (validatedFile.success) {
      onAddAccount(account, { select: true })
      hideModal()
    } else {
      setError(validatedFile.message)
    }

  }, [onAddAccount, passphrase, passphrase2, selectedAccount, setError, wallet, hideModal])

  useEffect(() => {
    setTimeout(() => {
      textFieldRef?.current?.focus()
    }, 100)
  }, [])

  return (
    <>
      <div className='instructions'>
        Validate the email associated with your signer account {wallet.address}
      </div>

      <TextInput password
                 className='mb-2'
                 ref={textFieldRef}
                 onChange={(v) => setPassphrase(v)}
                 placeholder='Password'/>

      <TextInput password
                 onChange={(v) => setPassphrase2(v)}
                 placeholder='Repeat password'/>

      <div className='buttonHolder'>
        <Button
          full
          onClick={onValidate}>
          Save
        </Button>
      </div>
    </>
  )
}

export default SetSeedWordsPassword
