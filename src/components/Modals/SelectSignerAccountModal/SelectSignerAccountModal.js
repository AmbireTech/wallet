import styles from  './SelectSignerAccountModal.module.scss'

import { useModals } from 'hooks'
import { Modal } from 'components/common'
import SelectSignerAccount from 'components/common/SelectSignerAccount/SelectSignerAccount'

const SelectSignerAccountModal = props => {
  const { hideModal } = useModals()

  const onSignerAddressClicked = (...args) => {
    props.onSignerAddressClicked(...args)

    hideModal()
  }

  return (
    <Modal className={styles.wrapper} title="Select a signer account">
      <SelectSignerAccount {...props} onSignerAddressClicked={onSignerAddressClicked} />
    </Modal>
  )
}

export default SelectSignerAccountModal
