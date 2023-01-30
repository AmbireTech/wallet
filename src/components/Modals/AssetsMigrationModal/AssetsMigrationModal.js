import { useState } from 'react'

import { useModals } from 'hooks'
import { Modal, Stepper } from 'components/common'
import AssetsMigration from './AssetMigration/AssetsMigration'

import styles from './AssetMigrationModal.module.scss'

const AssetsMigrationModal = ({ addRequest, selectedAccount, selectedNetwork, accounts, relayerURL, portfolio }) => {
  const { hideModal, setBeforeCloseModalHandler } = useModals()

  const [modalButtons, setModalButtons] = useState(null)
  const [modalSteps, setModalSteps] = useState({ steps: [], stepIndex: 0})

  const getModalTitle = () => {
    return (<div>
      <span>Migrate Assets</span>
    </div>)
  }

  return (
    <Modal className={styles.wrapper} title={getModalTitle()} buttons={modalButtons}>
      <Stepper steps={modalSteps.steps} currentStep={modalSteps.stepIndex} noLabels={false}/>
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
