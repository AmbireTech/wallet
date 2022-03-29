import { useModals } from 'hooks'
import { Modal } from 'components/common'

import AssetsMigration from 'components/Wallet/AssetsMigration/AssetsMigration'
import { useState } from 'react'

const AssetsMigrationModal = ({ addRequest, selectedAccount, selectedNetwork, accounts, relayerURL, portfolio }) => {
  const { hideModal } = useModals()

  const [modalButtons, setModalButtons] = useState(null)

  return (
    <Modal id='asset-migration-modal' title={'Migrate Assets'} buttons={modalButtons}>
      <AssetsMigration
        addRequest={addRequest}
        selectedAccount={selectedAccount}
        network={selectedNetwork}
        accounts={accounts}
        hideModal={hideModal}
        relayerURL={relayerURL}
        portfolio={portfolio}
        setModalButtons={setModalButtons}
      />
    </Modal>
  )
}

export default AssetsMigrationModal
