import './InputModal.scss'

import { createRef, useRef, useState } from 'react'
import { MdCheck, MdClose } from 'react-icons/md'
import { useModals } from 'hooks'
import { Modal, TextInput, Button, ToolTip } from "components/common"
import { resolveUDomain } from 'lib/unstoppableDomains'

const InputModal = ({ title, inputs, selectedNetwork, onClose }) => {
    const { hideModal } = useModals()
    const [isDisabled, setDisabled] = useState(true)
    const [uDAddress, setUDAddress] = useState('')
    const timer = useRef(null)

    const inputsFields = inputs.map(input => ({ ...input, ref: createRef() }))

    const getUDomain = async(value) => {    
        return await resolveUDomain(value, null, selectedNetwork.unstoppableDomainsChain) 
    }

    const onInput = () => {
        if (timer.current) {
            clearTimeout(timer.current)
        }

        const validateForm = async() => {
            const isFound = inputsFields.find(item => item.label === 'Name/Unstoppable domainsⓇ')
            
            if (isFound) {
                const uDAddr = await getUDomain(isFound.ref.current.value) 
                timer.current = null

                if (uDAddr) {
                    inputsFields.map(({ label, ref }) => (label === 'Address') ? ref.current.value = uDAddr : '')
                }
                setUDAddress(uDAddr)
            }
            
            const isFormValid = inputsFields
                .map(({ ref, validate }) => ref.current.value && (validate ? validate(ref.current.value) : true))
                .every(v => v === true)
            setDisabled(!isFormValid)
        }
        
        timer.current = setTimeout(async() => {
            return validateForm().catch(console.error)
        }, 500)
    }

    const onConfirm = () => {
        const values = inputsFields.map(({ ref }) => ref.current.value)
        onClose && onClose(values)
        hideModal()
    }

    const buttons = <>
        <Button clear small icon={<MdClose/>} onClick={hideModal}>Cancel</Button>
        <Button small icon={<MdCheck/>} disabled={isDisabled} onClick={onConfirm}>Confirm</Button>
    </>

    return (
        <Modal id="input-modal" title={title} buttons={buttons}>
            {
                inputsFields.map(({ id, label, placeholder, ref }) => (
                    <>
                        <TextInput key={id || label} label={label} placeholder={placeholder} onInput={onInput} ref={ref}/>
                        {(label === 'Name/Unstoppable domainsⓇ') && 
                            <ToolTip label={!uDAddress ? 'You can use Unstoppable domainsⓇ' : 'Valid Unstoppable domainsⓇ domain'}>
                                <div id="udomains-logo" className={uDAddress ? 'ud-logo-active ' : ''} />
                            </ToolTip>}
                    </>
                ))
            }
        </Modal>
    )
}

export default InputModal 