import { Button, TextInput } from 'components/common'
import { useCallback, useState, useRef, useEffect } from 'react'
import { Wallet } from 'ethers'

const UnlockAccount = ({ selectedAccount, accounts, setModalSteps, setMnemonic, setError }) => {

  const [isLoading, setIsLoading] = useState(false)
  const [passphrase, setPassphrase] = useState()

  const textFieldRef = useRef()

  const onUnlock = useCallback(async () => {
    if (!passphrase) {
      setError('Enter your passphrase')
      return
    }
    setError(null)
    setIsLoading(true)

    const currentAccount = accounts.find(a => selectedAccount.id.toLowerCase() === a.id.toLowerCase())

    if (currentAccount.primaryKeyBackup) {
      const keyBackup = JSON.parse(currentAccount.primaryKeyBackup)

      const wallet = await Wallet.fromEncryptedJson(keyBackup, passphrase).catch(err => {
        setError('Wallet decryption error: ' + err.message)
      })

      setIsLoading(false)

      if (wallet) {
        setMnemonic(wallet.mnemonic.phrase.split(' '))
        setModalSteps(prev => {
          return { ...prev, stepIndex: 1 }
        })
      }
    } else {
      // should not happen because button should be grayed out upstream
    }
  }, [passphrase, accounts, selectedAccount, setError, setModalSteps, setMnemonic])

  useEffect(() => {
    setTimeout(() => {
      textFieldRef?.current?.focus()
    }, 100)
  }, [])

  return (
    <>
      <div className='instructions'>
        Enter the passphrase for <span>{selectedAccount.email}</span> to continue
      </div>

      <TextInput password onChange={(val) => setPassphrase(val)} ref={textFieldRef} placeholder='Passphrase'/>

      <div className='buttonHolder'>
        <Button
          full
          disabled={isLoading}
          onClick={onUnlock}>
          Display seed words
        </Button>
      </div>
    </>
  )
}

export default UnlockAccount
