import './PermissionsModal.scss'

import { useEffect, useState } from 'react'
import { MdCheck, MdClose } from 'react-icons/md'
import { useModals } from '../../../hooks'
import { checkClipboardPermission, checkNotificationPermission, isFirefox } from '../../../helpers/permissions'
import { Modal, Toggle, Button } from "../../common"

const PermissionsModal = () => {
    const { hideModal } = useModals()
    const [clipboardGranted, setClipboardGranted] = useState(false)
    const [notificationGranted, setNotificationGranted] = useState(false)

    const checkForPermissions = async () => {
        setClipboardGranted(await checkClipboardPermission(true))
        setNotificationGranted(await checkNotificationPermission(true))
    }

    useEffect(() => checkForPermissions(), [])

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
                <Toggle checked={notificationGranted} onChange={() => {}}/>
            </div>
            <div className={`permission ${isFirefox ? 'disabled' : ''}`}>
                <div className="details">
                    <div className="name">Clipboard { isFirefox ? <span className="unavailable">(Unavailable in Firefox)</span> : null }</div>
                    <div className="description">
                        Needed so that dApps can be connected automatically just by copying their WalletConnect URL
                    </div>
                </div>
                <Toggle checked={clipboardGranted} onChange={() => {}}/>
            </div>
            <div className="buttons">
                <Button clear small icon={<MdClose/>} onClick={hideModal}>Ignore</Button>
                <Button small icon={<MdCheck/>} disabled={(!isFirefox && !clipboardGranted) || !notificationGranted} onClick={hideModal}>Done</Button>
            </div>
        </Modal>
    )
}

export default PermissionsModal