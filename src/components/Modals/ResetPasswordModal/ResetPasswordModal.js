import './ResetPasswordModal.scss'

import { Wallet } from 'ethers'
import { useState, useMemo, createRef, useEffect, useCallback } from 'react'
import { Modal, Radios, TextInput, Checkbox, Button } from '../../common'
import { MdOutlineCheck, MdOutlineClose } from 'react-icons/md'
import { useModals } from '../../../hooks'
import { useToasts } from '../../../hooks/toasts'
import { SCRYPT_OPTIONS } from '../../../consts/scryptOptions'

const ResetPassword = ({ account, selectedNetwork }) => {
    const { hideModal } = useModals()
    const { addToast } = useToasts()

    const [type, setType] = useState(null)
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
    const [disabled, setDisabled] = useState(true)

    const [passwordsMustMatchWarning, setPasswordsMustMatchWarning] = useState(false)
    const [passwordsLengthWarning, setPasswordsLengthWarning] = useState(false)
    
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
        setPasswordsMustMatchWarning(false)
        setPasswordsLengthWarning(false)
    }

    const changePassword = async () => {
        try {
            const wallet = await Wallet.fromEncryptedJson(JSON.parse(account.primaryKeyBackup), oldPassword)
            await wallet.encrypt(newPassword, { scrypt: SCRYPT_OPTIONS })
            addToast('You password was successfully updated')
        } catch(e) {
            console.error(e)
            addToast(e.message || e, { error: true })
        }
    }

    const validateForm = useCallback(() => {
        const arePasswordsMatching = newPassword === newPasswordConfirm
        let areFieldsNotEmpty = false
        let isLengthValid = false
        
        if (radios[0].value === type) {
            areFieldsNotEmpty = oldPassword.length && newPassword.length && newPasswordConfirm.length
            isLengthValid = oldPassword.length >= 8 && newPassword.length >= 8 && newPasswordConfirm.length >= 8
            setDisabled(!isLengthValid || !arePasswordsMatching)
        }

        if (radios[1].value === type) {
            areFieldsNotEmpty = newPassword.length && newPasswordConfirm.length
            isLengthValid = newPassword.length >= 8 && newPasswordConfirm.length >= 8
            const areCheckboxesChecked = checkboxes.every(({ ref }) => ref.current && ref.current.checked)
            setDisabled(!isLengthValid || !arePasswordsMatching || !areCheckboxesChecked)
        }

        if (areFieldsNotEmpty) {
            setPasswordsLengthWarning(!isLengthValid)
            setPasswordsMustMatchWarning(!arePasswordsMatching)
        } else {
            setPasswordsLengthWarning(false)
            setPasswordsMustMatchWarning(false)
        }
    }, [radios, checkboxes, type, oldPassword, newPassword, newPasswordConfirm])

    useEffect(() => validateForm(), [validateForm, oldPassword, newPassword, newPasswordConfirm])

    return (
        <Modal id="reset-password-modal" title="Reset Password">
            <Radios radios={radios} onChange={onRadioChange}/>
            {
                radios[0].value === type ?
                    <form>
                        <TextInput password placeholder="Old Password" onInput={value => setOldPassword(value)}/>
                        <TextInput password placeholder="New Password" onInput={value => setNewPassword(value)}/>
                        <TextInput password placeholder="Confirm New Password" onInput={value => setNewPasswordConfirm(value)}/>
                    </form> : null
            }
            {
                radios[1].value === type ?
                    <form>
                        <TextInput password placeholder="New Password" onInput={value => setNewPassword(value)}/>
                        <TextInput password placeholder="Confirm New Password" onInput={value => setNewPasswordConfirm(value)}/>
                        {
                            checkboxes.map(({ label, ref }, i) => (
                                <Checkbox key={`checkbox-${i}`} ref={ref} label={label} onChange={() => validateForm()}/>
                            ))
                        }
                    </form> : null
            }
            <div id="warnings">
                {
                    passwordsMustMatchWarning ?
                        <div className="warning">Passwords must match</div> : null
                }
                {
                    passwordsLengthWarning ?
                        <div className="warning">Password length must be greater than 8 characters</div> : null
                }
            </div>
            <div className="buttons">
                <Button icon={<MdOutlineClose/>} clear onClick={() => hideModal()}>Cancel</Button>
                <Button icon={<MdOutlineCheck/>} disabled={disabled} onClick={() => changePassword()}>Confirm</Button>
            </div>
        </Modal>
    )
}

export default ResetPassword