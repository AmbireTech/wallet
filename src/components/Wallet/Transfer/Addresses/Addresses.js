import './Addresses.scss'

import { MdOutlineAdd } from 'react-icons/md'
import AddressList from 'components/common/AddressBook/AddressList/AddressList'
import { Button } from 'components/common'
import { isValidAddress } from 'lib/address'
import { InputModal } from 'components/Modals'
import { useModals } from 'hooks'

const Addresses = ({ addresses, addAddress, removeAddress, onSelectAddress, selectedNetwork }) => {
    const { showModal } = useModals()

    const modalInputs = [
        { label: 'Name/Unstoppable domainsⓇ', placeholder: 'My Address' },
        { label: 'Address', placeholder: '0x', validate: value => isValidAddress(value) } 
    ]

    const inputModal = <InputModal title="Add New Address" selectedNetwork={selectedNetwork} inputs={modalInputs} onClose={([name, address]) => addAddress(name, address)}></InputModal>
    const showInputModal = () => showModal(inputModal)

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