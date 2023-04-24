import { isValidAddress } from 'ambire-common/src/services/address'

import { useModals } from 'hooks'
import { Button, Panel, AddressList } from 'components/common'
import { AddAddressModal } from 'components/Modals'

import styles from './Addresses.module.scss'

const Addresses = ({ addresses, addAddress, removeAddress, onSelectAddress, selectedNetwork }) => {
  const { showModal } = useModals()

  const modalInputs = [
    { inputType: 'name', label: 'Name', placeholder: 'Address title' },
    {
      inputType: 'address',
      label: 'Address / Unstoppable domainsⓇ / ENSⓇ',
      placeholder: 'Address / Unstoppable Domains / ENS',
      validate: (value) => isValidAddress(value)
    }
  ]

  const addAddressModal = (
    <AddAddressModal
      title="Add New Address"
      selectedNetwork={selectedNetwork}
      inputs={modalInputs}
      onClose={([name, address, type]) => addAddress(name, address, type)}
    />
  )
  const showInputModal = () => showModal(addAddressModal)

  return (
    <Panel title="Address Book" titleClassName={styles.title} className={styles.wrapper}>
      <AddressList
        noAccounts
        addresses={addresses}
        removeAddress={removeAddress}
        onSelectAddress={onSelectAddress}
        className={styles.addressList}
      />
      <Button onClick={showInputModal} className={styles.addressesButton}>
        Add Address
      </Button>
    </Panel>
  )
}

export default Addresses
