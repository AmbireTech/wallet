import { Button, Checkbox, Modal } from 'components/common'
import { useModals } from 'hooks'
import { useState } from 'react'
import { MdBrokenImage, MdClose } from 'react-icons/md'
import './UnsupportedDAppsModal.scss'

const UnsupportedDAppsModal = ({ connections, disconnect, advancedModeList }) => {
    const { hideModal } = useModals()
    const [advancedMode, setAdvancedMode] = useState(false)

    const onCancel = () => {
        connections.map(({ uri }) => disconnect(uri))
        hideModal()
    }

    const onContinue = () => {
       localStorage.dAppsAdvancedMode = JSON.stringify([
           ...advancedModeList,
           ...connections.map(({ session }) => session.peerMeta.url)
       ])
       hideModal()
    }

    const buttons = <>
        <Button clear icon={<MdClose/>} onClick={onCancel}>Cancel</Button>
        <Button disabled={!advancedMode} onClick={onContinue}>Continue</Button>
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
                        <a className='dapp' key={`dapp-${i}`} href={session.peerMeta.url} target="_blank" rel="norefferer">
                            <div className='icon' style={{ backgroundImage: `url(${session.peerMeta.icons[0]})` }}>
                                <MdBrokenImage/>
                            </div>
                            <div className='name'>{ session.peerMeta.name }</div>
                        </a>
                    ))
                }
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