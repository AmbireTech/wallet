import cn from 'classnames'
import { Button, Panel } from "components/common"
import { ReactComponent as ExportIcon } from 'resources/icons/export.svg'
import { ReactComponent as ImportIcon } from 'resources/icons/import.svg'

import styles from './Backup.module.scss'

import { BsFileEarmarkArrowUpFill, BsFileMedicalFill } from "react-icons/bs"

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
                return <Button icon={<BsFileEarmarkArrowUpFill />} full onClick={onPaperBackupClick} className={styles.button} >Backup on paper</Button>
            }
            return <Button full small disabled className={styles.button}>Keys required for paper backup</Button>
        }
        return <Button full small disabled className={styles.button}>Available for emails accounts only</Button>
    }

    const renderPaperImportButton = (account) => {
        if (account.email) {
            if (account.primaryKeyBackup) {
                return <Button icon={<BsFileMedicalFill />} className={styles.button} full disabled >Keys already active</Button>
            }
            return <Button icon={<BsFileMedicalFill />} className={styles.button} full onClick={onPaperImportClick}>Import from paper</Button>
        }
        return <Button icon={<BsFileMedicalFill />} className={styles.button} disabled >Available for emails accounts only</Button>
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
                <div className={styles.separator}></div>

                <div className={cn(styles.content, styles.export)}>
                    {
                        renderPaperExportButton(selectedAccount)
                    }
                    <p>
                        Backup your account ({selectedAccount.id.slice(0, 5)}...{selectedAccount.id.slice(-3)}) on paper as a seed phrase.
                        The seed phrase will be unencrypted, so store it safely.
                    </p>
                </div>

            </Panel>
            <Panel className={styles.panel} titleClassName={styles.panelTitle} title="Import an account from backup">
                <div className={cn(styles.content, styles.import)}>
                    <Button icon={<ImportIcon />} onClick={onOpen} className={styles.button}>Import</Button>
                    <p>...or you can drop an account backup JSON file on this page</p>
                </div>
                <div className={styles.separator}></div>
                <div className={cn(styles.content, styles.import)}>
                    {
                        renderPaperImportButton(selectedAccount)
                    }
                    <p>
                        Update your Ambire account ({selectedAccount.id.slice(0, 5)}...{selectedAccount.id.slice(-3)}) with signer keys from a backed up seed phrase
                    </p>
                </div>
            </Panel>
        </div>
    )
}

export default Backup
