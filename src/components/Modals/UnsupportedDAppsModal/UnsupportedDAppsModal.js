import { useState } from 'react'

import { useModals } from 'hooks'
import { Button, Checkbox, Modal, DAppIncompatibilityWarningMsg } from 'components/common'

import { MdBrokenImage } from 'react-icons/md'

import styles from './UnsupportedDAppsModal.module.scss'

const UnsupportedDAppsModal = ({ connections, disconnect, advancedModeList, onContinue }) => {
    const { hideModal } = useModals()
    const [advancedMode, setAdvancedMode] = useState(false)

    const handleCancel = () => {
        connections.map(({ uri }) => disconnect(uri))
        hideModal()
    }

    const handleContinue = () => {
        onContinue([
            ...advancedModeList,
            ...connections.map(({ session }) => session.peerMeta.url)
        ])
        hideModal()
    }

    return (
        <Modal
            className={styles.wrapper}
            contentClassName={styles.content}
            title="Unsupported dApps"
            buttons={<>
                <Button small clear onClick={handleCancel}>Cancel</Button>
                <Button small primaryGradient disabled={!advancedMode} onClick={handleContinue}>Continue</Button>
            </>}
            isCloseBtnShown={false}
        >
            <div className={styles.message}>
                These dApps does not fully support smart wallets and/or WalletConnect:
            </div>

            <div className={styles.dappsList}>
                {
                    connections.map(({ session }, i) => (
                        <a className={styles.dapp} key={`dapp-${i}`} href={session.peerMeta.url} target="_blank" rel="noreferrer">
                            <div className={styles.icon} style={{ backgroundImage: `url(${session.peerMeta.icons[0]})` }}>
                                <MdBrokenImage/>
                            </div>
                            <div className={styles.name}>{ session.peerMeta.name }</div>
                        </a>
                    ))
                }
            </div>
            <DAppIncompatibilityWarningMsg/>
            <div className={styles.message}>
                For more information on why these dApps do not support Ambire, please read <a href='https://help.ambire.com/hc/en-us/articles/4415496135698-Which-dApps-are-supported-by-Ambire-Wallet-' target='_blank' rel='noreferrer'>this article</a>.
	    </div>
            <div className={styles.separator}/>

            <div className={styles.advancedMode}>
                <label className={styles.advancedModeLabel}>Advanced mode:</label>
                <Checkbox label="I know what I'm doing and I accept the risks" checked={advancedMode} onChange={({ target }) => setAdvancedMode(target.checked)}/>
            </div>
        </Modal>
    )
}

export default UnsupportedDAppsModal
