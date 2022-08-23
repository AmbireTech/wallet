import './DAppIncompatibilityModal.scss'

import { MdClose } from 'react-icons/md'
import { useModals } from 'hooks'
import { Modal, Button, DAppIncompatibilityWarningMsg } from "components/common"

const DAppIncompatibilityModal = () => {
    const { hideModal } = useModals()
 
    const buttons = <>
        <Button clear small icon={<MdClose />} onClick={hideModal}>Ok</Button>
    </>

    return (
        <Modal id="dapp-incompatibility-modal" title={'WARNING'} buttons={buttons}>
            <DAppIncompatibilityWarningMsg />
        </Modal>
    )
}

export default DAppIncompatibilityModal
