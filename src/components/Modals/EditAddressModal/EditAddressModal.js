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
        setDisabled(!name.length || (ens.length && !isENSValid.success))
    }, [name, ens])

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
                    label="ENS Domain"
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