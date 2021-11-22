import './InputModal.scss'

import { MdCheck, MdClose } from 'react-icons/md'
import { useModals } from '../../../hooks'
import { Modal, TextInput, Button } from "../../common"
import { createRef } from 'react'

const InputModal = ({ title, inputs, onClose }) => {
    const { hideModal } = useModals()

    const inputsFields = inputs.map(input => ({ ...input, ref: createRef() }))
    const buttonDisabled = false

    const onConfirm = () => {
        const values = inputsFields.map(({ ref }) => ref.current.value)
        onClose && onClose(values)
        hideModal()
    }

    return (
        <Modal id="input-modal" title={title}>
            {
                inputsFields.map(({ id, label, ref }) => (
                    <TextInput key={id || label} label={label} onInput={() => {}} ref={ref}/>
                ))
            }
            <div className="buttons">
                <Button clear small icon={<MdClose/>} onClick={hideModal}>Cancel</Button>
                <Button small icon={<MdCheck/>} disabled={buttonDisabled} onClick={onConfirm}>Confirm</Button>
            </div>
        </Modal>
    )
}

export default InputModal 