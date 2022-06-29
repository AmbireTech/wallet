import { Modal, Stepper } from 'components/common'

import { useState } from 'react'

import './PaperImportModal.scss'
import ImportSeedWordsForm from './SubComponents/ImportSeedWordsForm'
import ValidateImportEmail from './SubComponents/ValidateImportEmail'

const PaperImportModal = () => {

  const [modalButtons] = useState(null)
  const [foundAddress, setFoundAddress] = useState(null)

  const [modalSteps, setModalSteps] = useState({
    steps: [
      {
        name: 'Import seed words'
      },
      {
        name: 'Confirm email'
      },
      {
        name: 'Set password'
      }
    ], stepIndex: 0
  })

  const [error, setError] = useState(null)

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
            setError={setError}
            setModalSteps={setModalSteps}
            foundAddress={foundAddress}
            setFoundAddress={setFoundAddress}
          />
        }

        {
          modalSteps.stepIndex === 1 &&
          <ValidateImportEmail
            foundAddress={foundAddress}
            setError={setError}
            setModalSteps={setModalSteps}
          />
        }

        {
          modalSteps.stepIndex === 2
        }

      </div>
    </Modal>
  )
}

export default PaperImportModal
