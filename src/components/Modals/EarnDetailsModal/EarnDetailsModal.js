import './EarnDetailsModal.scss'

import { MdClose } from 'react-icons/md'
import { useModals } from 'hooks'
import { Modal, Button } from 'components/common'

const EarnDetailsModal = ({ title = 'Details', description = '' }) => {
    const { hideModal } = useModals()
    const buttons = (<Button variant="secondary" size="sm" startIcon={<MdClose />} onClick={hideModal}>Close</Button>)
   
    return (
        <Modal id="wallet-more-details-modal" title={title} buttons={buttons}>
            <p>{description}</p>
        </Modal>
    )
}

export default EarnDetailsModal
