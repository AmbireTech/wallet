import { Modal, Stepper } from 'components/common'
import { useModals } from 'hooks'
import { useState } from 'react'

import ImportSeedWordsForm from './SubComponents/ImportSeedWordsForm'
import SetSeedWordsPassword from './SubComponents/SetSeedWordsPassword'

import './PaperImportModal.scss'

const PaperImportModal = ({ accounts, onAddAccount, selectedAccount, relayerURL, newAccount }) => {

  const [modalButtons, setModalButtons] = useState(null)
  const [foundAddress, setFoundAddress] = useState(null)
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
  const [retrievedIdentity, setRetrievedIdentity] = useState(null)

  const { hideModal } = useModals()

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
            accounts={accounts}
            foundAddress={foundAddress}
            hideModal={hideModal}
            newAccount={newAccount}
            relayerURL={relayerURL}
            retrievedIdentity={retrievedIdentity}
            selectedAccount={selectedAccount}
            setFoundAddress={setFoundAddress}
            setError={setError}
            setModalSteps={setModalSteps}
            setWallet={setWallet}
            setRetrievedIdentity={setRetrievedIdentity}
            setModalButtons={setModalButtons}
          />
        }

        {
          modalSteps.stepIndex === 1 &&
          <SetSeedWordsPassword
            newAccount={newAccount}
            selectedAccount={selectedAccount}
            wallet={wallet}
            setError={setError}
            onAddAccount={onAddAccount}
            setRetrievedIdentity={setRetrievedIdentity}
            retrievedIdentity={retrievedIdentity}
            hideModal={hideModal}
            setModalButtons={setModalButtons}
          />
        }
      </div>
    </Modal>
  )
}

export default PaperImportModal
