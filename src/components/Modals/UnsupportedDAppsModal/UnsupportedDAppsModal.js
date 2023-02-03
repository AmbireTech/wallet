import { Button, Checkbox, Modal, DAppIncompatibilityWarningMsg } from 'components/common'
import { useModals } from 'hooks'
import { useState } from 'react'
import { MdBrokenImage, MdClose } from 'react-icons/md'
import './UnsupportedDAppsModal.scss'

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

    const buttons = <>
        <Button variant="secondary" startIcon={<MdClose/>} onClick={handleCancel}>Cancel</Button>
        <Button variant="primaryGradient" disabled={!advancedMode} onClick={handleContinue}>Continue</Button>
    </>

    return (
        <Modal
            id="unsupported-dapps"
            title="Unsupported dApps"
            buttons={buttons}
            isCloseBtnShown={false}
        >
            <div className='message'>
                These dApps does not fully support smart wallets and/or WalletConnect:
            </div>

            <div className='dapps-list'>
                {
                    connections.map(({ session }, i) => (
                        <a className='dapp' key={`dapp-${i}`} href={session.peerMeta.url} target="_blank" rel="noreferrer">
                            <div className='icon' style={{ backgroundImage: `url(${session.peerMeta.icons[0]})` }}>
                                <MdBrokenImage/>
                            </div>
                            <div className='name'>{ session.peerMeta.name }</div>
                        </a>
                    ))
                }
            </div>
            <DAppIncompatibilityWarningMsg/>
            <div className='message'>
                For more information on why these dApps do not support Ambire, please read <a href='https://help.ambire.com/hc/en-us/articles/4415496135698-Which-dApps-are-supported-by-Ambire-Wallet-' target='_blank' rel='noreferrer'>this article</a>.
	    </div>
            <div className='separator'/>

            <div className='advanced-mode'>
                <label className='advanced-mode-label'>Advanced mode:</label>
                <Checkbox label="I know what I'm doing and I accept the risks" checked={advancedMode} onChange={({ target }) => setAdvancedMode(target.checked)}/>
            </div>
        </Modal>
    )
}

export default UnsupportedDAppsModal
