import { MdClose } from 'react-icons/md'
import { useModals } from 'hooks'
import { Modal, Button } from 'components/common'

const EarnDetailsModal = ({ title = 'Details', description = '' }) => {
    const { hideModal } = useModals()
    const buttons = (<Button clear small icon={<MdClose />} onClick={hideModal}>Close</Button>)
   
    return (
        <Modal title={title} buttons={buttons}>
            <p>{description}</p>
        </Modal>
    )
}

export default EarnDetailsModal
