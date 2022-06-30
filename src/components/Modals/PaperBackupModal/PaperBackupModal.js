import { useModals } from 'hooks'
import { Modal, Stepper } from 'components/common'

import { useState } from 'react'

import './PaperBackupModal.scss'
import SeedWordsList from './SubComponents/SeedWordsList'
import UnlockAccount from './SubComponents/UnlockAccount'
import VerifySeedWords from './SubComponents/VerifySeedWords'

const PaperBackupModal = ({ selectedAccount, accounts }) => {
  const { hideModal } = useModals()

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
      <Stepper steps={modalSteps.steps} currentStep={modalSteps.stepIndex} noLabels={false}/>
    </div>)
  }

  return (
    <Modal id='paper-backup-modal' title={getModalTitle()} buttons={modalButtons}>
      <div>
        {
          error && <div className='error-message'>
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
          />
        }

      </div>
    </Modal>
  )
}

export default PaperBackupModal
