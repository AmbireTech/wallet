import cn from 'classnames'
import { Button, Panel } from "components/common"
import { ReactComponent as ExportIcon } from 'resources/icons/export.svg'
import { ReactComponent as ImportIcon } from 'resources/icons/import.svg'

import styles from './Backup.module.scss'

const Backup = ({ selectedAccount, onOpen, onAddAccount }) => {
    const onBackupDownloaded = () => {
        onAddAccount({
            ...selectedAccount,
            downloadedBackup: true
        })
    }

    return (
        <div className={styles.wrapper}>
            <Panel className={styles.panel} titleClassName={styles.panelTitle} title="Backup current account">
                <div className={cn(styles.content, styles.export)}>
                    <a
                        type="button"
                        href={`data:text/json;charset=utf-8,${encodeURIComponent(
                            JSON.stringify(selectedAccount)
                        )}`}
                        download={`${selectedAccount.id}.json`}
                    >
                        <Button icon={<ExportIcon />} onClick={onBackupDownloaded} className={styles.button}>Export</Button>
                    </a>
                    <p>
                        Downloads a backup of your current account ({selectedAccount.id.slice(0, 5)}...{selectedAccount.id.slice(-3)}) encrypted with
                        your password. It's safe to store in iCloud/Google Drive, but you cannot use it to restore your account if you forget the password.
                        <b> You can only import this in Ambire</b>, it's not importable in other wallets.
                    </p>
                </div>
            </Panel>
            <Panel className={styles.panel} titleClassName={styles.panelTitle} title="Import an account from backup">
                <div className={cn(styles.content, styles.import)}>
                    <Button icon={<ImportIcon />} onClick={onOpen} className={styles.button}>Import</Button>
                    <p>...or you can drop an account backup JSON file on this page</p>
                </div>
            </Panel>
        </div>
    )
}

export default Backup