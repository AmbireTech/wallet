import './Addresses.scss'

import { MdOutlineAdd } from 'react-icons/md'
import AddressList from 'components/common/AddressBook/AddressList/AddressList'
import { Button } from 'components/common'
import { isValidAddress } from 'lib/address'
import { AddAddressModal } from 'components/Modals'
import { useModals } from 'hooks'

const Addresses = ({ addresses, addAddress, removeAddress, onSelectAddress, selectedNetwork }) => {
    const { showModal } = useModals()

    const modalInputs = [
        { inputType: 'name', label: 'Name', placeholder: 'Address title' },
        { inputType: 'address', label: 'Address / Unstoppable domainsⓇ / ENSⓇ', placeholder: 'Address / Unstoppable Domains / ENS', validate: value => isValidAddress(value) } 
    ]

    const addAddressModal = <AddAddressModal 
            title="Add New Address" 
            selectedNetwork={selectedNetwork} 
            inputs={modalInputs} 
            onClose={([name, address, type]) => addAddress(name, address, type)}
        ></AddAddressModal>
    const showInputModal = () => showModal(addAddressModal)

    return (
        <div id="addresses" className='panel'>
            <div className='title'>Address Book</div>
            <div className="content">
                <AddressList
                    noAccounts={true}
                    addresses={addresses}
                    removeAddress={removeAddress}
                    onSelectAddress={onSelectAddress}
                />
            </div>
            <div className="separator"></div>
            <Button icon={<MdOutlineAdd/>} onClick={showInputModal}>Add Address</Button>
        </div>
    )
}

export default Addresses