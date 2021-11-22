import './InputModal.scss'

import { createRef, useState } from 'react'
import { MdCheck, MdClose } from 'react-icons/md'
import { useModals } from '../../../hooks'
import { Modal, TextInput, Button } from "../../common"

const InputModal = ({ title, inputs, onClose }) => {
    const { hideModal } = useModals()
    const [isDisabled, setDisabled] = useState(true)

    const inputsFields = inputs.map(input => ({ ...input, ref: createRef() }))

    const onInput = () => {
        const isFormValid = inputsFields
            .map(({ ref, validate }) => ref.current.value && (validate ? validate(ref.current.value) : true))
            .every(v => v === true)
        setDisabled(!isFormValid)
    }

    const onConfirm = () => {
        const values = inputsFields.map(({ ref }) => ref.current.value)
        onClose && onClose(values)
        hideModal()
    }

    return (
        <Modal id="input-modal" title={title}>
            {
                inputsFields.map(({ id, label, ref }) => (
                    <TextInput key={id || label} label={label} onInput={onInput} ref={ref}/>
                ))
            }
            <div className="buttons">
                <Button clear small icon={<MdClose/>} onClick={hideModal}>Cancel</Button>
                <Button small icon={<MdCheck/>} disabled={isDisabled} onClick={onConfirm}>Confirm</Button>
            </div>
        </Modal>
    )
}

export default InputModal 