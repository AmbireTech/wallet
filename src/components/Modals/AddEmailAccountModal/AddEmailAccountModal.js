import './AddEmailAccountModal.scss'

import { useState } from 'react'
import { useModals } from 'hooks'
import { Modal, Stepper } from 'components/common'
import AddEmailAccountModalForm from './AddEmailAccountModalForm/AddEmailAccountModalForm'
import AddEmailAccountModalConfirmation from './AddEmailAccountModalConfirmation/AddEmailAccountModalConfirmation'
import AddEmailAccountModalTransaction from './AddEmailAccountModalTransaction/AddEmailAccountModalTransaction'

const AddEmailAccountModal = ({ relayerURL, showSendTxns, selectedAcc, selectedNetwork }) => {
  const { hideModal } = useModals()
  const [error, setError] = useState(null)

  const [modalButtons, setModalButtons] = useState(<></>)

  const [email, setEmail] = useState(null)
  const [stepIndex, setStepIndex] = useState(0)

  // for stepId 2
  const [identityData, setIdentityData] = useState(0)

  const steps = [{
      name: 'Register email'
    },
    {
      name: 'Confirm email'
    },
    {
      name: 'Sync on chain'
    }
  ]

  const getStepContent = (stepId) => {
    if (stepId === 0) {
      return <AddEmailAccountModalForm
        setError={setError}
        hideModal={hideModal}
        relayerURL={relayerURL}
        setModalButtons={setModalButtons}
        setEmail={setEmail}
        setStepIndex={setStepIndex}
        selectedAcc={selectedAcc}
        selectedNetwork={selectedNetwork}
      />
    } else if (stepId === 1) {
      return (
        <AddEmailAccountModalConfirmation
          setError={setError}
          hideModal={hideModal}
          relayerURL={relayerURL}
          setModalButtons={setModalButtons}
          email={email}
          setStepIndex={setStepIndex}
          setIdentityData={setIdentityData}
          selectedAcc={selectedAcc}
          selectedNetwork={selectedNetwork}
        />
      )
    } else if (stepId === 2) {
      return (
        <AddEmailAccountModalTransaction
          setError={setError}
          hideModal={hideModal}
          relayerURL={relayerURL}
          setModalButtons={setModalButtons}
          email={email}
          setStepIndex={setStepIndex}
          selectedAcc={selectedAcc}
          selectedNetwork={selectedNetwork}
          identityData={identityData}
          showSendTxns={showSendTxns}
        />
      )
    }
  }

  return (
    <Modal id='add-email-modal' title='Enter email' buttons={modalButtons}>
      <Stepper
        steps={steps}
        currentStep={stepIndex} />
      {error &&
        <div className='notification-hollow danger mb-4'>
          {error}
        </div>
      }
      {getStepContent(stepIndex)}
    </Modal>
  )
}

export default AddEmailAccountModal
