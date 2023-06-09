import { useModals } from 'hooks'
import { Modal, Button } from 'components/common'

const EarnDetailsModal = ({ title = 'Details', description = '' }) => {
  const { hideModal } = useModals()

  return (
    <Modal
      title={title}
      buttons={
        <Button variant="secondary" size="sm" onClick={hideModal}>
          Close
        </Button>
      }
    >
      <p>{description}</p>
    </Modal>
  )
}

export default EarnDetailsModal
