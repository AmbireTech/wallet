import './PermissionsModal.scss'

import { MdCheck, MdClose } from 'react-icons/md'
import { useModals, usePermissions } from '../../../hooks'
import { isFirefox } from '../../../helpers/permissions'
import { Modal, Toggle, Button } from "../../common"

const PermissionsModal = () => {
    const { hideModal } = useModals()
    const { isNoticationsGranted, isClipboardGranted } = usePermissions()

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
                <Toggle checked={isNoticationsGranted} onChange={() => {}}/>
            </div>
            <div className={`permission ${isFirefox ? 'disabled' : ''}`}>
                <div className="details">
                    <div className="name">Clipboard { isFirefox ? <span className="unavailable">(Unavailable in Firefox)</span> : null }</div>
                    <div className="description">
                        Needed so that dApps can be connected automatically just by copying their WalletConnect URL
                    </div>
                </div>
                <Toggle checked={isClipboardGranted} onChange={() => {}}/>
            </div>
            <div className="buttons">
                <Button clear small icon={<MdClose/>} onClick={hideModal}>Ignore</Button>
                <Button small icon={<MdCheck/>} disabled={(!isFirefox && !isClipboardGranted) || !isNoticationsGranted} onClick={hideModal}>Done</Button>
            </div>
        </Modal>
    )
}

export default PermissionsModal