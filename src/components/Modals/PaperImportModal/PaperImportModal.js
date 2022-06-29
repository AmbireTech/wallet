import { Modal, Stepper } from 'components/common'
import { useModals } from 'hooks'
import { useState } from 'react'

import ImportSeedWordsForm from './SubComponents/ImportSeedWordsForm'
import SetSeedWordsPassword from './SubComponents/SetSeedWordsPassword'

import './PaperImportModal.scss'

const PaperImportModal = ({onAddAccount, selectedAccount, relayerURL}) => {

  const [modalButtons] = useState(null)
  const [foundAddress, setFoundAddress] = useState(null)
  const { hideModal } = useModals()

  const [modalSteps, setModalSteps] = useState({
    steps: [
      {
        name: 'Import seed words'
      },
      {
        name: 'Set password'
      }
    ], stepIndex: 0
  })

  const [error, setError] = useState(null)
  const [wallet, setWallet] = useState(null)

  const getModalTitle = () => {
    return (<div>
      <span>Import backup from paper</span>
      <Stepper steps={modalSteps.steps} currentStep={modalSteps.stepIndex} noLabels={false}/>
    </div>)
  }

  return (
    <Modal id='paper-import-modal' title={getModalTitle()} buttons={modalButtons}>
      <div>
        {
          error && <div className='error-message'>
            {error}
          </div>
        }

        {
          modalSteps.stepIndex === 0 &&
          <ImportSeedWordsForm
            selectedAccount={selectedAccount}
            setError={setError}
            setModalSteps={setModalSteps}
            foundAddress={foundAddress}
            setFoundAddress={setFoundAddress}
            setWallet={setWallet}
          />
        }

        {
          modalSteps.stepIndex === 1 &&
          <SetSeedWordsPassword
            selectedAccount={selectedAccount}
            wallet={wallet}
            foundAddress={foundAddress}
            setError={setError}
            setModalSteps={setModalSteps}
            onAddAccount={onAddAccount}
            relayerURL={relayerURL}
            hideModal={hideModal}
          />
        }

      </div>
    </Modal>
  )
}

export default PaperImportModal
