import './PollModal.scss'


import { Button, Modal } from 'components/common'
// import { useState } from 'react'
import { MdVisibilityOff, MdOutlineClose } from 'react-icons/md'
import { useModals } from 'hooks'
import { useToasts } from 'hooks/toasts'

const PollModal = () => {
    const { hideModal } = useModals()
    const { addToast } = useToasts()

    const handleSend = () => {
        hideModal()
    }

    const handleCancel = address => {
        hideModal()
    }

    const buttons = <>
        <Button clear icon={<MdOutlineClose/>} onClick={handleCancel}>Cancel</Button>
        <Button icon={<MdVisibilityOff/>}  onClick={handleSend}>Send</Button>
    </>

    return (
        <Modal id="poll-modal" title="Poll Modal" buttons={buttons}>
            <h1>TEST</h1>
        </Modal>
    )
}

export default PollModal