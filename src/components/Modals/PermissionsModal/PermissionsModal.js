import './PermissionsModal.scss'

import { useState, useEffect, useCallback } from 'react'
import { MdCheck, MdClose } from 'react-icons/md'
import { useModals, usePermissions } from '../../../hooks'
import { useToasts } from '../../../hooks/toasts'
import { askForPermission } from '../../../helpers/permissions'
import { Modal, Toggle, Button, Checkbox } from '../../common'
import { isFirefox } from '../../../lib/isFirefox'
import { fetchGet } from '../../../lib/fetch'

const toastErrorMessage = name => `You blocked the ${name} permission. Check your browser permissions tab.`

const PermissionsModal = ({ relayerIdentityURL, isEmailConfirmationRequired }) => {
    const { hideModal } = useModals()
    const { isNoticationsGranted, isClipboardGranted, modalHidden, setModalHidden } = usePermissions()
    const { addToast } = useToasts()
    const [isEmailConfirmed, setEmailConfirmed] = useState(false)
    
    const buttonDisabled = !modalHidden && ((isEmailConfirmationRequired && !isEmailConfirmed) || ((!isFirefox() && !isClipboardGranted) || !isNoticationsGranted))
    const showEmailSentToast = () => addToast('Confirmation email already sent', { error: true })
    
    const checkEmailConfirmation = useCallback(async () => {
        const identity = await fetchGet(relayerIdentityURL)
        if (identity) {
            const { emailConfirmed } = identity.meta
            setEmailConfirmed(emailConfirmed && emailConfirmed === 1)
        }
    }, [relayerIdentityURL])
    
    const requestNotificationsPermission = async () => {
        const status = await askForPermission('notifications')
        if (!status) addToast(toastErrorMessage('Notifications'), { error: true })
    }
    
    const requestClipboardPermission = async () => {
        const status = await askForPermission('clipboard-read')
        if (!status) addToast(toastErrorMessage('Clipboard'), { error: true })
    }
    
    useEffect(() => {
        checkEmailConfirmation()
        const emailConfirmationInterval = setInterval(() => !isEmailConfirmed && checkEmailConfirmation(), 3000)
        return () => clearInterval(emailConfirmationInterval)
    }, [isEmailConfirmed, checkEmailConfirmation])

    return (
        <Modal id="permissions-modal" title="We need a few things 🙏">
            {
                isEmailConfirmationRequired ? 
                    <div className="permission">
                    <div className="details">
                        <div className="name">Email Confirmation</div>
                        <div className="description">
                            Confirming your email is required so that we can make sure your account can be recovered in case access is lost.
                            We already sent an email, please check your inbox.
                        </div>
                    </div>
                    <Toggle checked={isEmailConfirmed} onChange={() => showEmailSentToast()}/>
                </div>
                :
                null
            }
            <div className="permission">
                <div className="details">
                    <div className="name">Notifications Permission</div>
                    <div className="description">
                        Needed to draw your attention to Ambire Wallet when there is a transaction signing request.<br/>
                        You can also click the notifications to go directly to the Ambire tab.<br/>
                        We do not send any other notifications.
                    </div>
                </div>
                <Toggle checked={isNoticationsGranted} onChange={() => requestNotificationsPermission()}/>
            </div>
            <div className={`permission ${isFirefox() ? 'disabled' : ''}`}>
                <div className="details">
                    <div className="name">Clipboard Permission { isFirefox() ? <span className="unavailable">(Unavailable in Firefox)</span> : null }</div>
                    <div className="description">
                        Needed so that dApps can be connected automatically just by copying their WalletConnect URL.
                    </div>
                    { 
                        isFirefox() ? 
                            <div className="unavailable">
                                Without this, you can still use Ambire, but you will have to paste URLs manually
                            </div> : null
                    }
                </div>
                <Toggle checked={isClipboardGranted} onChange={() => requestClipboardPermission()}/>
            </div>
            <Checkbox label="I understand, do not show this again." disabled={!isEmailConfirmed} checked={isEmailConfirmed && modalHidden} onChange={({ target }) => isEmailConfirmed && setModalHidden(target.checked)}/>
            <div className="buttons">
                <Button clear small icon={<MdClose/>} onClick={hideModal}>Ignore</Button>
                <Button small icon={<MdCheck/>} disabled={buttonDisabled} onClick={hideModal}>Done</Button>
            </div>
        </Modal>
    )
}

export default PermissionsModal
