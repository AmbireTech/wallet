import './Backup.scss'

import { BiExport, BiImport } from "react-icons/bi"
import { Button } from "components/common"

const Backup = ({ selectedAccount, onOpen, onAddAccount }) => {
    const onBackupDownloaded = () => {
        onAddAccount({
            ...selectedAccount,
            downloadedBackup: true
        })
    }

    return (
        <div id="backup">
            <div className="panel">
                <div className="panel-title">Backup current account</div>
                <div className="content" id="export">
                    <a
                        type="button"
                        href={`data:text/json;charset=utf-8,${encodeURIComponent(
                            JSON.stringify(selectedAccount)
                        )}`}
                        download={`${selectedAccount.id}.json`}
                    >
                        <Button icon={<BiExport/>} onClick={onBackupDownloaded}>Export</Button>
                    </a>
                    <div style={{ fontSize: '0.9em' }}>
                        Downloads a backup of your current account ({selectedAccount.id.slice(0, 5)}...{selectedAccount.id.slice(-3)}) encrypted with
                        your password. It's safe to store in iCloud/Google Drive, but you cannot use it to restore your account if you forget the password.
                        <b> You can only import this in Ambire</b>, it's not importable in other wallets.
                    </div>
                </div>
            </div>
            <div className="panel">
                <div className="panel-title">Import an account from backup</div>
                <div className="content" id="import">
                    <Button icon={<BiImport/>} onClick={onOpen}>Import</Button>
                    <p>...or you can drop an account backup JSON file on this page</p>
                </div>
            </div>
        </div>
    )
}

export default Backup