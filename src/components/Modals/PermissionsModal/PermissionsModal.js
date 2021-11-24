import './PermissionsModal.scss'

import { MdCheck, MdClose } from 'react-icons/md'
import { useModals, usePermissions } from '../../../hooks'
import { useToasts } from '../../../hooks/toasts'
import { askForPermission, isFirefox } from '../../../helpers/permissions'
import { Modal, Toggle, Button, Checkbox } from "../../common"

const toastErrorMessage = name => `You blocked the ${name} permission. Check your browser permissions tab.`

const PermissionsModal = () => {
    const { hideModal } = useModals()
    const { isNoticationsGranted, isClipboardGranted, modalHidden, setModalHidden } = usePermissions()
    const { addToast } = useToasts()

    const requestNotificationsPermission = async () => {
        const status = await askForPermission('notifications')
        if (!status) addToast(toastErrorMessage('Notifications'), { error: true })
    }

    const requestClipboardPermission = async () => {
        const status = await askForPermission('clipboard-read')
        if (!status) addToast(toastErrorMessage('Clipboard'), { error: true })
    }

    const buttonDisabled = !modalHidden && ((!isFirefox && !isClipboardGranted) || !isNoticationsGranted)

    return (
        <Modal id="permissions-modal" title="Permissions">
            <div className="intro">
                Ambire Wallet needs you to allow some browser permissions to improve your experience.
            </div>
            <div className="permission">
                <div className="details">
                    <div className="name">Notifications</div>
                    <div className="description">
                        Needed to draw your attention to Ambire Wallet when there is a transaction signing request.<br/>
                        You can also click the notifications to go directly to the Ambire tab.<br/>
                        We do not send any other notifications.
                    </div>
                </div>
                <Toggle checked={isNoticationsGranted} onChange={() => requestNotificationsPermission()}/>
            </div>
            <div className={`permission ${isFirefox ? 'disabled' : ''}`}>
                <div className="details">
                    <div className="name">Clipboard { isFirefox ? <span className="unavailable">(Unavailable in Firefox)</span> : null }</div>
                    <div className="description">
                        Needed so that dApps can be connected automatically just by copying their WalletConnect URL.
                    </div>
                    { 
                        isFirefox ? 
                            <div className="unavailable">
                                Without this, you can still use Ambire, but you will have to paste URLs manually
                            </div> : null
                    }
                </div>
                <Toggle checked={isClipboardGranted} onChange={() => requestClipboardPermission()}/>
            </div>
            <Checkbox label="I understand, do not show this again." checked={modalHidden} onChange={({ target }) => setModalHidden(target.checked)}/>
            <div className="buttons">
                <Button clear small icon={<MdClose/>} onClick={hideModal}>Ignore</Button>
                <Button small icon={<MdCheck/>} disabled={buttonDisabled} onClick={hideModal}>Done</Button>
            </div>
        </Modal>
    )
}

export default PermissionsModal
