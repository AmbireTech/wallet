import { useState, useMemo, createRef, useEffect, useCallback } from 'react'
import { Wallet } from 'ethers'
import { id } from 'ethers/lib/utils'
import accountPresets from 'ambire-common/src/constants/accountPresets'

import buildRecoveryBundle from 'lib/recoveryBundle'
import { fetchPost } from 'lib/fetch'

import { useModals } from 'hooks'
import { useToasts } from 'hooks/toasts'
import { Modal, Radios, Checkbox, Button, ToolTip, Loading, PasswordInput } from 'components/common'

import { MdOutlineHelpOutline } from 'react-icons/md'

import styles from './ResetPasswordModal.module.scss'

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
    const [oldPasswordEmptyWarning, setOldPasswordEmptyWarning] = useState(false)

    const radios = useMemo(() => [
        {
            label: 'Change the password on this device and Ambire Cloud. Best if you just want to routinely change the password.',
            value: 'change',
            disabled: !account.primaryKeyBackup
        },
        {
            label: 'Reset the key and password: takes 3 days. Chose this if you\'ve forgotten the old password.',
            value: 'reset'
        }
    ], [account.primaryKeyBackup])

    const checkboxes = useMemo(() => ([
        [
            {
                label: 
                    <>
                        I understand the following: the new password will be required for subsequent logins, but places where you're already logged in will work with the old password until you re-login.
                        <ToolTip
                            className='tooltip'
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
                        className='tooltip'
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
        setOldPasswordEmptyWarning(false)
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
                setLoading(false)
                hideModal()
            } else {
                throw new Error(`Unable to update account: ${resp.message || 'unknown error'}`)
            }
        } catch(e) {
            console.error(e)
            addToast('Changing password error: '+(e.message || e), { error: true })
        }

        setLoading(false)
    }

    const resetPassword = async () => {
        setLoading(true)
        // let react do one tick of rerendering before we block on .encrypt/.signMessage
        await new Promise(resolve => setTimeout(resolve))

        try {
            // @TODO: move extraEntropy to a util
            const extraEntropy = id(account.email + ':' + Date.now() + ':' + Math.random() + ':' + (typeof performance === 'object' && performance.now()))
            const firstKeyWallet = Wallet.createRandom({ extraEntropy })

            const { quickAccManager, quickAccTimelock, encryptionOpts } = accountPresets
            const signer = {
                quickAccManager,
                timelock: quickAccTimelock,
                one: firstKeyWallet.address,
                two: account.signer.two,
                preRecovery: account.signer
            }

            const primaryKeyBackup = JSON.stringify(await firstKeyWallet.encrypt(newPassword, encryptionOpts))

            const bundle = buildRecoveryBundle(account.id, selectedNetwork.id, signer.preRecovery, { signer, primaryKeyBackup })
            hideModal()
            showSendTxns(bundle, true)
            onAddAccount({
                ...account,
                primaryKeyBackup,
                signer,
                preRecoveryPrimaryKeyBackup: account.primaryKeyBackup
            }, { select: true })
        } catch(e) {
            console.error(e);
            addToast('Reset password error: ' + (e.message || e), { error: true })
        }

        setLoading(false)
    }

    const validateForm = useCallback(() => {
        const arePasswordsMatching = newPassword === newPasswordConfirm
        const isLengthValid = newPassword.length >= 8 && newPasswordConfirm.length >= 8
        const areFieldsNotEmpty = newPassword.length && newPasswordConfirm.length
        let isOldPasswordNotEmpty = false
        let areCheckboxesChecked = false
        
        if (type === 'change') {
            isOldPasswordNotEmpty = oldPassword.length
            areCheckboxesChecked = checkboxes[0].every(({ ref }) => ref.current && ref.current.checked)
        }

        if (type === 'reset') {
            isOldPasswordNotEmpty = true // in case of Reset we don't have an Old Password, so we just skip its validation
            areCheckboxesChecked = checkboxes[1].every(({ ref }) => ref.current && ref.current.checked)
        }

        setDisabled(!isLengthValid || !arePasswordsMatching || !areCheckboxesChecked || !isOldPasswordNotEmpty)

        if (areFieldsNotEmpty) {
            if (isLengthValid && arePasswordsMatching) {
                setOldPasswordEmptyWarning(!isOldPasswordNotEmpty)
            }

            setPasswordsLengthWarning(!isLengthValid)
            setPasswordsMustMatchWarning(!arePasswordsMatching)
        } else {
            setOldPasswordEmptyWarning(false)
            setPasswordsMustMatchWarning(false)
            setPasswordsMustMatchWarning(false)
        }
    }, [checkboxes, type, oldPassword, newPassword, newPasswordConfirm])

    useEffect(() => validateForm(), [isLoading, validateForm, oldPassword, newPassword, newPasswordConfirm])

    return (
        <Modal
            className={styles.wrapper}
            contentClassName={styles.content}
            title="Reset Password" 
            buttons={<>
                <Button small clear onClick={() => hideModal()}>Cancel</Button>
                <Button small primaryGradient disabled={disabled} onClick={() => type === 'change' ? changePassword(): resetPassword()}>Confirm</Button>
            </>}
        >
            {
                isLoading ?
                    <div className={styles.loadingOverlay}>
                        <Loading/>
                    </div>
                    :
                    null
            }
            <Radios radios={radios} onChange={onRadioChange} className={styles.radiosContainer} />
            {
                type === 'change' ?
                    <form>
                        <PasswordInput className={styles.passwordInput} autocomplete="current-password" placeholder="Old Password" onInput={value => setOldPassword(value)}/>
                        <PasswordInput className={styles.passwordInput} peakPassword autocomplete="new-password" placeholder="New Password" onInput={value => setNewPassword(value)}/>
                        <PasswordInput className={styles.passwordInput} autocomplete="new-password" placeholder="Confirm New Password" onInput={value => setNewPasswordConfirm(value)}/>
                        {
                            checkboxes[0].map(({ label, ref }, i) => (
                                <Checkbox labelClassName='checkbox-label' key={`checkbox-${i}`} ref={ref} label={label} onChange={() => validateForm()}/>
                            ))
                        }
                    </form> : null
            }
            {
                type === 'reset' ?
                    <form>
                        <PasswordInput className={styles.passwordInput} peakPassword autocomplete="new-password" placeholder="New Password" onInput={value => setNewPassword(value)}/>
                        <PasswordInput className={styles.passwordInput} autocomplete="new-password" placeholder="Confirm New Password" onInput={value => setNewPasswordConfirm(value)}/>
                        {
                            checkboxes[1].map(({ label, ref }, i) => (
                                <Checkbox labelClassName={styles.checkboxLabel} key={`checkbox-${i}`} ref={ref} label={label} onChange={() => validateForm()}/>
                            ))
                        }
                    </form> : null
            }
            <div id="warnings">
                {
                    oldPasswordEmptyWarning ?
                        <div className={styles.warning}>Old Password must be set</div> : null
                }
                {
                    passwordsMustMatchWarning ?
                        <div className={styles.warning}>Passwords must match</div> : null
                }
                {
                    passwordsLengthWarning ?
                        <div className={styles.warning}>Password must be at least 8 characters</div> : null
                }
            </div>
        </Modal>
    )
}

export default ResetPassword