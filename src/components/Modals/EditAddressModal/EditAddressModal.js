import './EditAddressModal.scss'

import { MdOutlineClose, MdOutlineSave } from 'react-icons/md'
import { Button, Modal, TextInput } from '../../common'
import { useEffect, useState } from 'react'
import { useModals } from '../../../hooks'
import { validateENSDomain } from '../../../lib/validations/formValidations'

const EditAddressModal = ({ id, addresses, updateAddress, addAddress }) => {
    const { hideModal } = useModals()
    const addressEntry = addresses.find(({ isAccount, address }) => !isAccount && address === id)

    const [name, setName] = useState(addressEntry ? addressEntry.name : '')
    const [ens, setEns] = useState(addressEntry ? addressEntry.ens : '')
    const [disabled, setDisabled] = useState(false)

    const onSave = () => {
        addressEntry ? updateAddress(addressEntry.id, { name, ens }) : addAddress(name, id)
        hideModal()
    }

    useEffect(() => {
        const isENSValid = validateENSDomain(ens)
        setDisabled((name && !name.length) || (ens && ens.length && !isENSValid.success))
    }, [name, ens])

    const modalButtons = <>
        <Button clear icon={<MdOutlineClose/>}>Cancel</Button>
        <Button disabled={disabled} icon={<MdOutlineSave/>} onClick={onSave}>Save</Button>
    </>

    return (
        <Modal
            id="edit-address-modal"
            title="Edit Address"
            buttons={modalButtons}
        >
            <form>
                <TextInput
                    label="Address"
                    value={addressEntry ? addressEntry.address : id}
                    disabled
                />
                <TextInput
                    label="Name"
                    placeholder="My Account"
                    value={name}
                    onInput={value => setName(value)}
                />
                <TextInput
                    label="ENS Domain"
                    placeholder="my-domain.eth"
                    value={ens}
                    onInput={value => setEns(value)}
                />
            </form>
        </Modal>
    )
}

export default EditAddressModal