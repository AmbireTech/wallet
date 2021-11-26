import './ResetPasswordModal.scss'

import { useState } from 'react'
import { Modal, Radios, TextInput, Checkbox, Button } from '../../common'
import { MdOutlineCheck, MdOutlineClose } from 'react-icons/md'

const ResetPassword = ({ selectedNetwork }) => {
    const [type, setType] = useState(null)

    const radios = [
        {
            label: 'I want to change my password',
            value: 'change'
        },
        {
            label: 'I forgot my old password',
            value: 'forgot'
        }
    ]

    const disabled = type === null

    return (
        <Modal id="reset-password-modal" title="Reset Password">
            <Radios radios={radios} onChange={value => setType(value)}/>
            {
                radios[0].value === type ?
                    <form>
                        <TextInput placeholder="Old Password"/>
                        <TextInput placeholder="New Password"/>
                        <TextInput placeholder="Confirm New Password"/>
                    </form> : null
            }
            {
                radios[1].value === type ?
                    <form>
                        <TextInput placeholder="New Password"/>
                        <TextInput placeholder="Confirm New Password"/>
                        <Checkbox label={`I understand I am only changing the password on the ${selectedNetwork.name} network`}/>
                        <Checkbox label={`I confirm the fee of <...> to apply this change on ${selectedNetwork.name}`}/>
                        <Checkbox label="I understand I need to wait for 3 days for the change to be confirmed"/>
                    </form> : null
            }
            <div className="buttons">
                <Button icon={<MdOutlineClose/>} clear>Cancel</Button>
                <Button icon={<MdOutlineCheck/>} disabled={disabled}>Confirm</Button>
            </div>
        </Modal>
    )
}

export default ResetPassword