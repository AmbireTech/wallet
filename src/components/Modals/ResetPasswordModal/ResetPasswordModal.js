import './ResetPasswordModal.scss'

import { Wallet } from 'ethers'
import { useState, useMemo, createRef, useEffect, useCallback } from 'react'
import { Modal, Radios, TextInput, Checkbox, Button, ToolTip, Loading } from '../../common'
import { MdOutlineCheck, MdOutlineClose, MdOutlineHelpOutline } from 'react-icons/md'
import { useModals } from '../../../hooks'
import { useToasts } from '../../../hooks/toasts'
import accountPresets from '../../../consts/accountPresets'
import { fetchPost } from '../../../lib/fetch'

const ResetPassword = ({ account, selectedNetwork, relayerURL, onAddAccount }) => {
    const { hideModal } = useModals()
    const { addToast } = useToasts()

    const [isLoading, setLoading] = useState(false)
    const [type, setType] = useState(null)
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
    const [disabled, setDisabled] = useState(true)

    const [passwordsMustMatchWarning, setPasswordsMustMatchWarning] = useState(false)
    const [passwordsLengthWarning, setPasswordsLengthWarning] = useState(false)
    
    const radios = useMemo(() => [
        {
            label: 'Change the password on this device and Ambire Cloud. Best if you just want to routinely change the password.',
            value: 'change'
        },
        // {
        //     label: 'Reset the key and password: takes 3 days. Best if you\'ve forgotten the old password.',
        //     value: 'forgot'
        // }
    ], [])

    const checkboxes = useMemo(() => ([
        [
            {
                label: 
                    <>
                        I understand the following: the new password will be required for subsequent logins, but places where you're already logged in will work with the old password until you re-login.
                        <ToolTip
                            label="This is because, for security reasons, the encrypted key is retrieved only when logging in, so we have no way of forcing every device to update it.
                            If you want to disable access for other devices, consider the next option.">
                            <MdOutlineHelpOutline/>
                        </ToolTip>
                    </>,
                ref: createRef()
            }
        ],
        [
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
        ]
    ]), [selectedNetwork.name])

    const onRadioChange = value => {
        setType(value)
        setOldPassword('')
        setNewPassword('')
        setNewPasswordConfirm('')
        setPasswordsMustMatchWarning(false)
        setPasswordsLengthWarning(false)
    }

    const changePassword = async () => {
        setLoading(true)
        await new Promise(resolve => setTimeout(resolve))

        try {
            const wallet = await Wallet.fromEncryptedJson(JSON.parse(account.primaryKeyBackup), oldPassword)
            const primaryKeyBackup = JSON.stringify(await wallet.encrypt(newPassword, accountPresets.encryptionOpts))
            const sig = await wallet.signMessage(JSON.stringify({ primaryKeyBackup }))
            const resp = await fetchPost(`${relayerURL}/identity/${account.id}/modify`, { primaryKeyBackup, sig })

            if (resp.success) {
                onAddAccount({ ...account, primaryKeyBackup })
                addToast('You password was successfully updated')
                hideModal()
            } else {
                throw new Error(`Unable to update account: ${resp.message || 'unknown error'}`)
            }
        } catch(e) {
            console.error(e)
            addToast(e.message || e, { error: true })
        }

        setLoading(false)
    }

    const validateForm = useCallback(() => {
        const arePasswordsMatching = newPassword === newPasswordConfirm
        let areFieldsNotEmpty = false
        let isLengthValid = false
        let areCheckboxesChecked = false
        
        if (type === 'change') {
            areFieldsNotEmpty = oldPassword.length && newPassword.length && newPasswordConfirm.length
            isLengthValid = oldPassword.length >= 8 && newPassword.length >= 8 && newPasswordConfirm.length >= 8
            areCheckboxesChecked = checkboxes[0].every(({ ref }) => ref.current && ref.current.checked)
        }

        if (type === 'reset') {
            areFieldsNotEmpty = newPassword.length && newPasswordConfirm.length
            isLengthValid = newPassword.length >= 8 && newPasswordConfirm.length >= 8
            areCheckboxesChecked = checkboxes[1].every(({ ref }) => ref.current && ref.current.checked)
        }

        setDisabled(!isLengthValid || !arePasswordsMatching || !areCheckboxesChecked)

        if (areFieldsNotEmpty) {
            setPasswordsLengthWarning(!isLengthValid)
            setPasswordsMustMatchWarning(!arePasswordsMatching)
        } else {
            setPasswordsLengthWarning(false)
            setPasswordsMustMatchWarning(false)
        }
    }, [checkboxes, type, oldPassword, newPassword, newPasswordConfirm])

    useEffect(() => validateForm(), [isLoading, validateForm, oldPassword, newPassword, newPasswordConfirm])

    return (
        <Modal id="reset-password-modal" title="Reset Password">
            {
                isLoading ?
                    <div id="loading-overlay">
                        <Loading/>
                    </div>
                    :
                    null
            }
            <Radios radios={radios} onChange={onRadioChange}/>
            {
                type === 'change' ?
                    <form>
                        <TextInput password autocomplete="current-password" placeholder="Old Password" onInput={value => setOldPassword(value)}/>
                        <TextInput password autocomplete="new-password" placeholder="New Password" onInput={value => setNewPassword(value)}/>
                        <TextInput password autocomplete="new-password" placeholder="Confirm New Password" onInput={value => setNewPasswordConfirm(value)}/>
                        {
                            checkboxes[0].map(({ label, ref }, i) => (
                                <Checkbox key={`checkbox-${i}`} ref={ref} label={label} onChange={() => validateForm()}/>
                            ))
                        }
                    </form> : null
            }
            {
                type === 'reset' ?
                    <form>
                        <TextInput password autocomplete="new-password" placeholder="New Password" onInput={value => setNewPassword(value)}/>
                        <TextInput password autocomplete="new-password" placeholder="Confirm New Password" onInput={value => setNewPasswordConfirm(value)}/>
                        {
                            checkboxes[1].map(({ label, ref }, i) => (
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