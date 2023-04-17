import { createRef, useState } from 'react'

import { useModals } from 'hooks'
import { Modal, TextInput, Button } from "components/common"

import styles from './InputModal.module.scss'

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
        <Modal 
            className={styles.wrapper}
            contentClassName={styles.content}
            title={title} 
            buttons={<>
                <Button size="sm" variant="secondary" onClick={hideModal}>Cancel</Button>
                <Button size="sm" variant="primaryGradient" disabled={isDisabled} onClick={onConfirm}>Confirm</Button>
            </>}
        >
            {
                inputsFields.map(({ id, label, placeholder, ref }) => (
                    <TextInput key={id || label} label={label} placeholder={placeholder} onInput={onInput} ref={ref}/>
                ))
            }
        </Modal>
    )
}

export default InputModal 