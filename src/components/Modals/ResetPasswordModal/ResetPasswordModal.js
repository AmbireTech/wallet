import './ResetPasswordModal.scss'

import { useState, useMemo, createRef, useEffect, useCallback } from 'react'
import { Modal, Radios, TextInput, Checkbox, Button } from '../../common'
import { MdOutlineCheck, MdOutlineClose } from 'react-icons/md'

const ResetPassword = ({ selectedNetwork }) => {
    const [type, setType] = useState(null)
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
    const [passwordsMustMatch, setPasswordsMustMatch] = useState(false)
    const [disabled, setDisabled] = useState(true)

    const checkboxes = useMemo(() => [
        {
            label: `I understand I am only changing the password on the ${selectedNetwork.name} network`,
            ref: createRef()
        },
        {
            label: `I confirm the fee of <...> to apply this change on ${selectedNetwork.name}`,
            ref: createRef()
        },
        {
            label: 'I understand I need to wait for 3 days for the change to be confirmed',
            ref: createRef()
        }
    ], [selectedNetwork.name])

    const radios = useMemo(() => [
        {
            label: 'I want to change my password',
            value: 'change'
        },
        {
            label: 'I forgot my old password',
            value: 'forgot'
        }
    ], [])

    const onRadioChange = value => {
        setType(value)
        setOldPassword('')
        setNewPassword('')
        setNewPasswordConfirm('')
        setPasswordsMustMatch(false)
    }

    const validateForm = useCallback(() => {
        const arePasswordsMatching = newPassword === newPasswordConfirm
        setPasswordsMustMatch(!arePasswordsMatching)

        if (radios[0].value === type) {
            const isLengthValid = oldPassword.length >= 8 && newPassword.length >= 8 && newPasswordConfirm.length >= 8
            setDisabled(!isLengthValid || !arePasswordsMatching)
        }

        if (radios[1].value === type) {
            const isLengthValid = newPassword.length >= 8 && newPasswordConfirm.length >= 8
            const areCheckboxesChecked = checkboxes.every(({ ref }) => ref.current && ref.current.checked)
            setDisabled(!isLengthValid || !arePasswordsMatching || !areCheckboxesChecked)
        }
    }, [radios, checkboxes, type, oldPassword, newPassword, newPasswordConfirm])

    useEffect(() => validateForm(), [validateForm, oldPassword, newPassword, newPasswordConfirm])

    return (
        <Modal id="reset-password-modal" title="Reset Password">
            <Radios radios={radios} onChange={onRadioChange}/>
            {
                radios[0].value === type ?
                    <form>
                        <TextInput placeholder="Old Password" onInput={value => setOldPassword(value)}/>
                        <TextInput placeholder="New Password" onInput={value => setNewPassword(value)}/>
                        <TextInput placeholder="Confirm New Password" onInput={value => setNewPasswordConfirm(value)}/>
                    </form> : null
            }
            {
                radios[1].value === type ?
                    <form>
                        <TextInput placeholder="New Password" onInput={value => setNewPassword(value)}/>
                        <TextInput placeholder="Confirm New Password" onInput={value => setNewPasswordConfirm(value)}/>
                        {
                            checkboxes.map(({ label, ref }, i) => (
                                <Checkbox key={`checkbox-${i}`} ref={ref} label={label} onChange={() => validateForm()}/>
                            ))
                        }
                    </form> : null
            }
            {
                passwordsMustMatch ?
                    <div id="passwords-match-warning">Passwords must match</div> : null
            }
            <div className="buttons">
                <Button icon={<MdOutlineClose/>} clear>Cancel</Button>
                <Button icon={<MdOutlineCheck/>} disabled={disabled}>Confirm</Button>
            </div>
        </Modal>
    )
}

export default ResetPassword