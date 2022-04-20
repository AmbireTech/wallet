import './AddAddressModal.scss'

import { createRef, useRef, useState } from 'react'
import { MdCheck, MdClose } from 'react-icons/md'
import { useModals } from 'hooks'
import { Modal, TextInput, Button, ToolTip } from "components/common"
import { resolveUDomain } from 'lib/unstoppableDomains'

const AddAddressModal = ({ title, inputs, selectedNetwork, onClose }) => {
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
            const isFound = inputsFields.find(item => item.label === 'Address / Unstoppable domainsⓇ')
            let uDAddr = null
            if (isFound) {
                if (!isFound.ref) return
                uDAddr = await getUDomain(isFound.ref.current.value) 
                timer.current = null
                setUDAddress(uDAddr)
            }
            
            const isFormValid = inputsFields
                .map(({ ref, validate }) => ref && !!ref.current.value && (validate ? validate(uDAddr ? uDAddr : ref.current.value) : true))
                .every(v => v === true)
            setDisabled(!isFormValid)
        }
        
        timer.current = setTimeout(async() => {
            return validateForm().catch(console.error)
        }, 500)
    }

    const onConfirm = () => {
        let values = inputsFields.map(({ ref }) => ref.current.value)
        if (uDAddress) values.push(uDAddress ? true : false)
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
                    <div key={id + label}>
                        <TextInput label={label} placeholder={placeholder} onInput={onInput} ref={ref}/>
                        {(label === 'Address / Unstoppable domainsⓇ') && 
                            <ToolTip label={!uDAddress ? 'You can use Unstoppable domainsⓇ' : 'Valid Unstoppable domainsⓇ domain'}>
                                <span id="udomains-logo" className={uDAddress ? 'ud-logo-active ' : ''} />
                            </ToolTip>}
                    </div>
                ))
            }
        </Modal>
    )
}

export default AddAddressModal 