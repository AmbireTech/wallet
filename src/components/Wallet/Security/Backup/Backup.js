import './Backup.scss'

import { BsFileEarmarkTextFill, BsFileEarmarkArrowDownFill, BsFileEarmarkArrowUpFill, BsFileMedicalFill } from "react-icons/bs"

import { Button } from "components/common"
import { PaperBackupModal, PaperImportModal } from 'components/Modals'
import useModals from 'hooks/modals'

const Backup = ({ selectedAccount, accounts, onOpen, onAddAccount, relayerURL }) => {

    const { showModal } = useModals()

    const onBackupDownloaded = () => {
        onAddAccount({
            ...selectedAccount,
            downloadedBackup: true
        })
    }

    const onPaperBackupClick = () => {
        showModal(<PaperBackupModal
          selectedAccount={selectedAccount}
          accounts={accounts}
          onAddAccount={onAddAccount}
        />)
    }

    const onPaperImportClick = () => {
        showModal(<PaperImportModal
          accounts={accounts}
          onAddAccount={onAddAccount}
          selectedAccount={selectedAccount}
          relayerURL={relayerURL}
        />)
    }

    const renderPaperExportButton = (account) => {
        if (account.email) {
            if (account.primaryKeyBackup) {
                return <Button full small onClick={onPaperBackupClick}>Backup on paper</Button>
            }
            return <Button full small disabled className='email-accounts-only'>Keys required for paper backup</Button>
        }
        return <Button full small disabled className='email-accounts-only'>Available for emails accounts only</Button>
    }

    const renderPaperImportButton = (account) => {
        if (account.email) {
            if (account.primaryKeyBackup) {
                return <Button full small disabled >Keys already active</Button>
            }
            return <Button small full onClick={onPaperImportClick}>Import from paper</Button>
        }
        return <Button full small disabled className='email-accounts-only'>Available for emails accounts only</Button>
    }

    return (
        <div id="backup">
            <div className="panel">
                <div className="panel-title">Backup current account</div>
                <div className='backup-note'>
                    <b>Note:</b> Those backups exports will be importable in Ambire Wallet only. They are not importable in other wallets.
                </div>
                <div className="content" id="export">

                    <div className='panel-sub'>
                        <div className='backupIcon'>
                            <BsFileEarmarkArrowDownFill />
                        </div>
                        <div className='backup-info'>
                            <p>
                                Download a backup of your current account ({selectedAccount.id.slice(0, 5)}...{selectedAccount.id.slice(-3)}) encrypted with
                                your password. It's safe to store in iCloud/Google Drive, but you cannot use it to restore your account if you forget the password.
                            </p>

                            <a
                              className='buttonLink'
                              type="button"
                              href={`data:text/json;charset=utf-8,${encodeURIComponent(
                                JSON.stringify(selectedAccount)
                              )}`}
                              download={`${selectedAccount.id}.json`}
                            >
                                <Button small full onClick={onBackupDownloaded}>Export as JSON</Button>
                            </a>
                        </div>
                    </div>

                    <div className='panel-sub'>
                        <div className='backupIcon'>
                            <BsFileEarmarkTextFill />
                        </div>
                        <div className='backup-info'>
                            <p>
                                Backup your account ({selectedAccount.id.slice(0, 5)}...{selectedAccount.id.slice(-3)}) on paper as a seed phrase.
                                The seed phrase will be unencrypted, so store it safely.
                            </p>
                            {
                                renderPaperExportButton(selectedAccount)
                            }
                        </div>
                    </div>

                </div>
            </div>
            <div className="panel" id="import">
                <div className="panel-title">Import an account from backup</div>
                <div className='backup-note'>
                    <b>Note:</b> Only backups previously saved with Ambire Wallet are compatible.
                </div>
                <div className='panel-sub'>
                    <div className='backupIcon'>
                        <BsFileEarmarkArrowUpFill />
                    </div>
                    <div className='backup-info'>
                        <p>
                            Import an Ambire account from a backed up JSON file.<br />
                            You can also drag and drop an account backup JSON file on this page
                        </p>
                        <Button small full onClick={onOpen}>Import from JSON</Button>
                    </div>
                </div>

                <div className='panel-sub'>
                    <div className='backupIcon'>
                        <BsFileMedicalFill />
                    </div>
                    <div className='backup-info'>
                        <p>
                            Update your Ambire account ({selectedAccount.id.slice(0, 5)}...{selectedAccount.id.slice(-3)}) with signer keys from a backed up seed phrase
                        </p>
                        {
                            renderPaperImportButton(selectedAccount)
                        }
                    </div>
                </div>

            </div>
        </div>
    )
}

export default Backup
