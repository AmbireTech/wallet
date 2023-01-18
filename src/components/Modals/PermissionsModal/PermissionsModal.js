import './PermissionsModal.scss'

import { useState } from 'react'
import { MdCheck, MdClose, MdOutlineCheck } from 'react-icons/md'
import { useModals, usePermissions } from 'hooks'
import { useToasts } from 'hooks/toasts'
import { askForPermission } from 'lib/permissions'
import { Modal, Toggle, Button, Checkbox } from 'components/common'
import { isFirefox } from 'lib/isFirefox'
import {
    BsFileEarmarkArrowDownFill,
    BsFileEarmarkTextFill,
} from 'react-icons/bs'
import { PaperBackupModal } from 'components/Modals'
import accountPresets from 'ambire-common/src/constants/accountPresets'

const toastErrorMessage = name => `You blocked the ${name} permission. Check your browser permissions tab.`

const PermissionsModal = ({ relayerIdentityURL, account, onAddAccount, isCloseBtnShown, isBackupOptout, setRedisplayPermissionsModal, showThankYouPage }) => {
    const { hideModal, showModal } = useModals()
    const { isNoticationsGranted, isClipboardGranted, modalHidden, setModalHidden } = usePermissions()
    const { addToast } = useToasts()
    const [isJsonBackupDownloaded, setIsJsonBackupDownloaded] = useState(isBackupOptout)

    setRedisplayPermissionsModal(false)

    const days = Math.ceil(accountPresets.quickAccTimelock / 86400)
    const areBlockedPermissions = (!isFirefox() && !isClipboardGranted) || !isNoticationsGranted
    const isAccountNotConfirmed = account.emailConfRequired
    const buttonDisabled = isAccountNotConfirmed || (!modalHidden && areBlockedPermissions)
    
    const requestNotificationsPermission = async () => {
        const status = await askForPermission('notifications')
        if (!status) addToast(toastErrorMessage('Notifications'), { error: true })
    }

    const requestClipboardPermission = async () => {
        const status = await askForPermission('clipboard-read')
        if (!status) addToast(toastErrorMessage('Clipboard'), { error: true })
    }
    
    const handleDoneOrIgnoreBtnsClicked = () => {
        hideModal()
        if (showThankYouPage) openThankYouPage()
    }

    const handleOnClose = () => {
        if (showThankYouPage) openThankYouPage()
    }
    const openThankYouPage = () => window.open("https://www.ambire.com/thankyou", "_blank")

    const buttons = isJsonBackupDownloaded ? (<>
        <Button clear small icon={<MdClose/>} disabled={isAccountNotConfirmed} onClick={handleDoneOrIgnoreBtnsClicked}>Ignore</Button>
        <Button small icon={<MdCheck/>} disabled={buttonDisabled} onClick={handleDoneOrIgnoreBtnsClicked}>Done</Button>
    </>) : (<>
        <Button clear small icon={<MdClose/>} disabled={true} onClick={handleDoneOrIgnoreBtnsClicked}>Ignore</Button>
        <Button small icon={<MdCheck/>} disabled={true} onClick={handleDoneOrIgnoreBtnsClicked}>Done</Button>
    </>)

    const downloadFile = ({ data, fileName, fileType }) => {
        const blob = new Blob([data], { type: fileType })

        const a = document.createElement('a')
        a.download = fileName
        a.href = window.URL.createObjectURL(blob)
        const clickEvt = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
        })
        a.dispatchEvent(clickEvt)
        a.remove()
    }

    const handlePaperBackupClicked = () => {
        showModal(<PaperBackupModal
          selectedAccount={account}
          accounts={[account]}
          onAddAccount={onAddAccount}
          modalCloseHandler={() => {
            setRedisplayPermissionsModal(true)
          }}
        />)
    }

    const handleExportClicked = () => {
        setIsJsonBackupDownloaded(true)
        let copiedAcc = { ...account }
        console.log('copiedAcc',copiedAcc)
        if (typeof copiedAcc.emailConfRequired !== 'undefined') delete copiedAcc.emailConfRequired
        if (typeof copiedAcc.backupOptout !== 'undefined') delete copiedAcc.backupOptout
        if (typeof copiedAcc.cloudBackupOptout !== 'undefined') delete copiedAcc.cloudBackupOptout

        downloadFile({
            data: JSON.stringify(copiedAcc),
            fileName: `${copiedAcc.id}.json`,
            fileType: 'text/json',
        })

        onAddAccount({
            ...account,
            backupOptout: false
        })
    }

    return (
        <Modal id="permissions-modal" title="We need a few things 🙏" buttons={buttons} isCloseBtnShown={isCloseBtnShown} onClose={handleOnClose}>
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
            {!isBackupOptout && <div className="permission">
                <div className="details">
                    <div className="name">Download a backup</div>
                    <div className="description">
                        In case you forget your password or lose your backup, <br/>
                        you will have to wait {days} days and pay the recovery fee to restore access to your account.
                    </div>
                </div>
                <div className="status">
                    {isJsonBackupDownloaded ?
                        (<span className="check-icon"><MdOutlineCheck/></span>) :
                        (
                            <div className='export-buttons'>
                                <Button small onClick={handleExportClicked} icon={<BsFileEarmarkArrowDownFill />}>JSON Export</Button>
                                <Button small onClick={handlePaperBackupClicked} icon={<BsFileEarmarkTextFill />}>Paper Export</Button>
                            </div>
                        )
                    }
                </div>
            </div>}
            {isAccountNotConfirmed
                ? (<></>)
                // Not gonna show this at all if the email is not confirmed
                : (<Checkbox
                    label="I understand, do not show this again."
                    checked={modalHidden}
                    onChange={({ target }) => setModalHidden(target.checked)}/>)
            }
            {
                !isBackupOptout ? <p className="download-backup">You have to download a backup of you profile before you can continue</p> : null
            }
        </Modal>
    )
}

export default PermissionsModal
