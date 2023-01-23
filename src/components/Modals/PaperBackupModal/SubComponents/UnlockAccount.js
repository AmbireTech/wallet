import { Button, TextInput } from 'components/common'
import { useCallback, useState, useRef, useEffect } from 'react'
import { Wallet } from 'ethers'
import { MdClose } from 'react-icons/md'

import styles from './SubComponents.module.scss'

const UnlockAccount = ({ selectedAccount, accounts, setModalSteps, setMnemonic, setError, setModalButtons, hideModal }) => {

  const [isLoading, setIsLoading] = useState(false)
  const [passphrase, setPassphrase] = useState()

  const textFieldRef = useRef()

  const currentAccount = accounts.find(a => selectedAccount.id.toLowerCase() === a.id.toLowerCase())

  const onUnlock = useCallback(async () => {
    if (!passphrase) {
      setError('Enter your passphrase')
      return
    }
    setError(null)
    setIsLoading(true)

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
  }, [passphrase, setError, currentAccount.primaryKeyBackup, setMnemonic, setModalSteps])

  useEffect(() => {

    if (!currentAccount.primaryKeyBackup) {
      setModalButtons([<Button
        full
        clear
        icon={<MdClose/>}
        className={'primary'}
        onClick={() => hideModal()}
      >Close</Button>])
    }

    setTimeout(() => {
      textFieldRef?.current?.focus()
    }, 100)
  }, [currentAccount, hideModal, setModalButtons])

  // This should not happen
  if (!currentAccount.primaryKeyBackup) {
    return (<div>
      Your account does not have any imported keys. Import your keys first.
    </div>)
  }

  return (
    <>
      <div className={styles.instructions}>
        Enter the passphrase for <span>{selectedAccount.email}</span> to continue
      </div>

      <TextInput password onChange={(val) => setPassphrase(val)} ref={textFieldRef} placeholder='Passphrase'/>

      <div className={styles.buttonHolder}>
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
