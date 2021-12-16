import './Addresses.scss'

import { MdOutlineAdd } from 'react-icons/md'
import AddressList from '../../../common/AddressBook/AddressList/AddressList'
import { Button } from '../../../common'
import { isValidAddress } from '../../../../helpers/address'
import { InputModal } from '../../../Modals'
import { useModals } from '../../../../hooks'

const Addresses = ({ addresses, addAddress, removeAddress }) => {
    const { showModal } = useModals()

    const modalInputs = [
        { label: 'Name', placeholder: 'My Address' },
        { label: 'Address', placeholder: '0x', validate: value => isValidAddress(value) }
    ]

    const inputModal = <InputModal title="Add New Address" inputs={modalInputs} onClose={([name, address]) => addAddress(name, address)}></InputModal>
    const showInputModal = () => showModal(inputModal)

    return (
        <div id="addresses" className='panel'>
            <div className='title'>Address Book</div>
            <div className="content">
                <AddressList
                    noAccounts={true}
                    addresses={addresses}
                    removeAddress={removeAddress}
                />
            </div>
            <div className="separator"></div>
            <Button icon={<MdOutlineAdd/>} onClick={showInputModal}>Add Address</Button>
        </div>
    )
}

export default Addresses