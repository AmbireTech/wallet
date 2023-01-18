import './AssetsMigrationModal.scss'

import { useModals } from 'hooks'
import { Modal, Stepper } from 'components/common'

import AssetsMigration from 'components/Wallet/AssetsMigration/AssetsMigration'
import { useState } from 'react'

const AssetsMigrationModal = ({ addRequest, selectedAccount, selectedNetwork, accounts, relayerURL, portfolio }) => {
  const { hideModal, setBeforeCloseModalHandler } = useModals()

  const [modalButtons, setModalButtons] = useState(null)
  const [modalSteps, setModalSteps] = useState({ steps: [], stepIndex: 0})

  const getModalTitle = () => {
    return (<div>
      <span>Migrate Assets</span>
      <Stepper steps={modalSteps.steps} currentStep={modalSteps.stepIndex} noLabels={false}/>
    </div>)
  }

  return (
    <Modal id='asset-migration-modal' title={getModalTitle()} buttons={modalButtons} >
      <AssetsMigration
        addRequest={addRequest}
        selectedAccount={selectedAccount}
        network={selectedNetwork}
        accounts={accounts}
        hideModal={hideModal}
        relayerURL={relayerURL}
        portfolio={portfolio}
        setModalButtons={setModalButtons}
        setModalSteps={setModalSteps}
        setBeforeCloseModalHandler={setBeforeCloseModalHandler}
      />
    </Modal>
  )
}

export default AssetsMigrationModal
