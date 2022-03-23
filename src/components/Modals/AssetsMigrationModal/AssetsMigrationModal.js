import { MdClose } from 'react-icons/md'
import { useModals } from 'hooks'
import { Modal, Button } from 'components/common'

import AssetsMigration from 'components/Wallet/AssetsMigration/AssetsMigration'

const AssetsMigrationModal = ({ addRequest, selectedAccount, selectedNetwork, accounts }) => {
  const { hideModal } = useModals()
  const buttons = (<Button clear small icon={<MdClose/>} onClick={hideModal}>Close</Button>)

  return (
    <Modal id='asset-migration-modal' title={'Migrate Assets'} buttons={buttons}>
      <AssetsMigration
        addRequest={addRequest}
        selectedAccount={selectedAccount}
        network={selectedNetwork}
        accounts={accounts}
        hideModal={hideModal}
      />
    </Modal>
  )
}

export default AssetsMigrationModal
