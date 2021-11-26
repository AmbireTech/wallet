import './ResetPasswordModal.scss'

import { useState, useMemo, createRef, useEffect, useCallback } from 'react'
import { Modal, Radios, TextInput, Checkbox, Button } from '../../common'
import { MdOutlineCheck, MdOutlineClose } from 'react-icons/md'
import { useModals } from '../../../hooks'

const ResetPassword = ({ selectedNetwork }) => {
    const { hideModal } = useModals()

    const [type, setType] = useState(null)
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
    const [disabled, setDisabled] = useState(true)

    const [passwordsMustMatch, setPasswordsMustMatch] = useState(false)
    const [passwordsLength, setPasswordsLength] = useState(false)
    
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
        setPasswordsLength(false)
    }

    const validateForm = useCallback(() => {
        const arePasswordsMatching = newPassword === newPasswordConfirm
        setPasswordsMustMatch(!arePasswordsMatching)

        if (radios[0].value === type) {
            const isLengthValid = oldPassword.length >= 8 && newPassword.length >= 8 && newPasswordConfirm.length >= 8
            setPasswordsLength(!isLengthValid)
            setDisabled(!isLengthValid || !arePasswordsMatching)
        }

        if (radios[1].value === type) {
            const isLengthValid = newPassword.length >= 8 && newPasswordConfirm.length >= 8
            const areCheckboxesChecked = checkboxes.every(({ ref }) => ref.current && ref.current.checked)
            setPasswordsLength(!isLengthValid)
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
            <div id="warnings">
                {
                    passwordsMustMatch ?
                        <div className="warning">Passwords must match</div> : null
                }
                {
                    passwordsLength ?
                        <div className="warning">Password length must be greater than 8 characters</div> : null
                }
            </div>
            <div className="buttons">
                <Button icon={<MdOutlineClose/>} clear onClick={() => hideModal()}>Cancel</Button>
                <Button icon={<MdOutlineCheck/>} disabled={disabled}>Confirm</Button>
            </div>
        </Modal>
    )
}

export default ResetPassword