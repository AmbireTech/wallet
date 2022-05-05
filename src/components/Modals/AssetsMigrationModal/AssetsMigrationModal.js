import { useModals } from 'hooks'
import { Modal, Stepper } from 'components/common'

import AssetsMigration from 'components/Wallet/AssetsMigration/AssetsMigration'
import { useEffect, useState } from 'react'

const AssetsMigrationModal = ({ addRequest, selectedAccount, selectedNetwork, accounts, relayerURL, portfolio }) => {
  const { hideModal } = useModals()

  const [modalButtons, setModalButtons] = useState(null)
  const [modalSteps, setModalSteps] = useState({ steps: [], stepIndex: 0})
  const [modalTitle, setModalTitle] = useState(null)

  useEffect(() => {

    setModalTitle(<div>
      <span>Migrate Assets</span>
      <Stepper steps={modalSteps.steps} currentStep={modalSteps.stepIndex} noLabels={false}/>
    </div>)

  }, [modalSteps])

  return (
    <Modal id='asset-migration-modal' title={modalTitle} buttons={modalButtons}>
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
      />
    </Modal>
  )
}

export default AssetsMigrationModal
