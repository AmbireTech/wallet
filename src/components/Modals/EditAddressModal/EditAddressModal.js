import './EditAddressModal.scss'

import { MdOutlineClose, MdOutlineSave } from 'react-icons/md'
import { Button, Modal, TextInput } from '../../common'
import { useState } from 'react'
import { useModals } from '../../../hooks'

const EditAddressModal = ({ id, addresses, updateAddress, addAddress }) => {
    const { hideModal } = useModals()
    const addressEntry = addresses.find(({ isAccount, address }) => !isAccount && address === id)

    const [name, setName] = useState(addressEntry ? addressEntry.name : '')
    const [ens, setEns] = useState(addressEntry ? addressEntry.ens : '')

    const disabled = !(name && name.length)

    const onSave = () => {
        addressEntry ? updateAddress(addressEntry.id, { name, ens }) : addAddress(name, id)
        hideModal()
    }

    return (
        <Modal
            id="edit-address-modal"
            title="Edit Address"
        >
            <form>
                <TextInput
                    label="Address"
                    value={addressEntry ? addressEntry.address : id}
                    disabled
                />
                <TextInput
                    label="Name"
                    value={name}
                    onInput={value => setName(value)}
                />
                <TextInput
                    label="ENS"
                    value={ens}
                    onInput={value => setEns(value)}
                />
            </form>

            <div className="buttons">
                <Button clear icon={<MdOutlineClose/>}>Cancel</Button>
                <Button disabled={disabled} icon={<MdOutlineSave/>} onClick={onSave}>Save</Button>
            </div>
        </Modal>
    )
}

export default EditAddressModal