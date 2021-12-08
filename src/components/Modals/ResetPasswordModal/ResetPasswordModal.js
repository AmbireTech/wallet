import './ResetPasswordModal.scss'

import { Wallet } from 'ethers'
import { AbiCoder, keccak256, id } from 'ethers/lib/utils'
import { useState, useMemo, createRef, useEffect, useCallback } from 'react'
import { Modal, Radios, Checkbox, Button, ToolTip, Loading, PasswordInput } from '../../common'
import { MdOutlineCheck, MdOutlineClose, MdOutlineHelpOutline } from 'react-icons/md'
import { useModals } from '../../../hooks'
import { useToasts } from '../../../hooks/toasts'
import accountPresets from '../../../consts/accountPresets'
import { fetchPost } from '../../../lib/fetch'
import buildRecoveryBundle from '../../../helpers/recoveryBundle'

const ResetPassword = ({ account, selectedNetwork, relayerURL, onAddAccount, showSendTxns }) => {
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
        {
            label: 'Reset the key and password: takes 3 days. Chose this if you\'ve forgotten the old password.',
            value: 'reset'
        }
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
                label: <>
                    I understand I am only changing the password on the {selectedNetwork.name} network.
                    <ToolTip
                        label="You will be able to trigger the change for other networks by switching the network">
                        <MdOutlineHelpOutline/>
                    </ToolTip>
                </>,
                ref: createRef()
            },
            {
                label: 'I understand I need to wait for 3 days for the change to be finalized.',
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
        // let react do one tick of rerendering before we block on .encrypt/.signMessage
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

    const resetPassword = async () => {
        setLoading(true)

        try {
            const extraEntropy = id(account.email + ':' + Date.now() + ':' + Math.random() + ':' + (typeof performance === 'object' && performance.now()))
            const firstKeyWallet = Wallet.createRandom({ extraEntropy })
            const secondKeySecret = Wallet.createRandom({ extraEntropy }).mnemonic.phrase.split(' ').slice(0, 6).join(' ') + ' ' + account.email

            const secondKeyResp = await fetchPost(`${relayerURL}/second-key`, { secondKeySecret })
            if (!secondKeyResp.address) throw new Error(`second-key returned no address, error: ${secondKeyResp.message || secondKeyResp}`)

            const { quickAccManager, quickAccTimelock, encryptionOpts } = accountPresets
            const quickAccountTuple = [quickAccTimelock, firstKeyWallet.address, secondKeyResp.address]
            const signer = {
                quickAccManager,
                timelock: quickAccountTuple[0],
                one: quickAccountTuple[1],
                two: quickAccountTuple[2],
                preRecovery: account.signer
            }

            const primaryKeyBackup = JSON.stringify(await firstKeyWallet.encrypt(newPassword, encryptionOpts))

            const abiCoder = new AbiCoder()
            const newQuickAccHash = keccak256(abiCoder.encode(['tuple(uint, address, address)'], [quickAccountTuple]))

            const bundle = buildRecoveryBundle(account.id, selectedNetwork.id, signer, newQuickAccHash)
            showSendTxns(bundle)

            onAddAccount({
                ...account,
                primaryKeyBackup,
                signer,
                preRecoveryPrimaryKeyBackup: account.primaryKeyBackup
            }, { select: true })
        } catch(e) {
            console.error(e);
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

    const modalButtons = <>
        <Button icon={<MdOutlineClose/>} clear onClick={() => hideModal()}>Cancel</Button>
        <Button icon={<MdOutlineCheck/>} disabled={disabled} onClick={() => type === 'change' ? changePassword(): resetPassword()}>Confirm</Button>
    </>

    return (
        <Modal id="reset-password-modal" title="Reset Password" buttons={modalButtons}>
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
                        <PasswordInput autocomplete="current-password" placeholder="Old Password" onInput={value => setOldPassword(value)}/>
                        <PasswordInput peakPassword autocomplete="new-password" placeholder="New Password" onInput={value => setNewPassword(value)}/>
                        <PasswordInput autocomplete="new-password" placeholder="Confirm New Password" onInput={value => setNewPasswordConfirm(value)}/>
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
                        <PasswordInput peakPassword autocomplete="new-password" placeholder="New Password" onInput={value => setNewPassword(value)}/>
                        <PasswordInput autocomplete="new-password" placeholder="Confirm New Password" onInput={value => setNewPasswordConfirm(value)}/>
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
        </Modal>
    )
}

export default ResetPassword