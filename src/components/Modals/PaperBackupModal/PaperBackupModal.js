import { useModals } from 'hooks'
import { Modal, Stepper } from 'components/common'

import { useLayoutEffect, useState } from 'react'

import styles from './PaperBackupModal.module.scss'
import SeedWordsList from './SubComponents/SeedWordsList'
import UnlockAccount from './SubComponents/UnlockAccount'
import VerifySeedWords from './SubComponents/VerifySeedWords'

const PaperBackupModal = ({ selectedAccount, accounts, modalCloseHandler, onAddAccount }) => {
  const { hideModal, setBeforeCloseModalHandler } = useModals()

  const [modalButtons, setModalButtons] = useState(null)
  const [modalSteps, setModalSteps] = useState({
    steps: [
      {
        name: 'Unlock account'
      },
      {
        name: 'Write seed words'
      },
      {
        name: 'Verify seed words'
      }
    ], stepIndex: 0
  })

  const [error, setError] = useState(null)
  const [mnemonic, setMnemonic] = useState(null)

  const getModalTitle = () => {
    return (<div>
      <span>Backup on paper</span>
    </div>)
  }

  useLayoutEffect(() => {
    if (modalCloseHandler) {
      setBeforeCloseModalHandler(() => modalCloseHandler)
    }
  }, [setBeforeCloseModalHandler, modalCloseHandler])

  return (
    <Modal className={styles.modal} title={getModalTitle()} buttons={modalButtons}>
      <div className={styles.stepper}>
        <Stepper steps={modalSteps.steps} currentStep={modalSteps.stepIndex} noLabels={false}/>
      </div>
      <div>
        {
          error && <div className={`error-message ${styles.errorMessage}`}>
            {error}
          </div>
        }

        {
          modalSteps.stepIndex === 0 &&
          <UnlockAccount
            setModalButtons={setModalButtons}
            hideModal={hideModal}
            setModalSteps={setModalSteps}
            selectedAccount={selectedAccount}
            accounts={accounts}
            setMnemonic={setMnemonic}
            setError={setError}/>
        }

        {
          modalSteps.stepIndex === 1 &&
          <SeedWordsList
            setModalSteps={setModalSteps}
            words={mnemonic}/>
        }

        {
          modalSteps.stepIndex === 2 &&
          <VerifySeedWords
            setModalButtons={setModalButtons}
            setModalSteps={setModalSteps}
            words={mnemonic}
            setError={setError}
            hideModal={hideModal}
            onAddAccount={onAddAccount}
            accounts={accounts}
            selectedAccount={selectedAccount}
          />
        }

      </div>
    </Modal>
  )
}

export default PaperBackupModal
