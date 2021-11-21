import './PermissionsModal.scss'

import { MdCheck, MdClose } from 'react-icons/md'
import { useModals, usePermissions } from '../../../hooks'
import { useToasts } from '../../../hooks/toasts'
import { askForPermission, isFirefox } from '../../../helpers/permissions'
import { Modal, Toggle, Button } from "../../common"

const PermissionsModal = () => {
    const { hideModal } = useModals()
    const { isNoticationsGranted, isClipboardGranted } = usePermissions()
    const { addToast } = useToasts()

    const requestNotificationsPermission = async () => {
        const status = await askForPermission('notifications')
        if (!status) addToast('You blocked the Notifications permission.', { error: true })
    }

    const requestClipboardPermission = async () => {
        const status = await askForPermission('clipboard-read')
        if (!status) addToast('You blocked the Clipboard permission.', { error: true })
    }

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
                        Needed so that dApps can be connected automatically just by copying their WalletConnect URL
                    </div>
                </div>
                <Toggle checked={isClipboardGranted} onChange={() => requestClipboardPermission()}/>
            </div>
            <div className="buttons">
                <Button clear small icon={<MdClose/>} onClick={hideModal}>Ignore</Button>
                <Button small icon={<MdCheck/>} disabled={(!isFirefox && !isClipboardGranted) || !isNoticationsGranted} onClick={hideModal}>Done</Button>
            </div>
        </Modal>
    )
}

export default PermissionsModal