import { useModals } from 'hooks'
import { Button, Modal } from 'components/common'

import { ReactComponent as AlertIcon } from 'resources/icons/alert.svg'

import styles from './CloseModal.module.scss'
import { useEffect } from 'react'

const CloseSDKModal = () => {
  const { hideModal } = useModals()

  const handleClose = () => {
    window.parent.postMessage(
      {
        type: 'actionClose',
      },
      '*'
    )
  }

  // Removes the edges that stick out of modal-container
  useEffect(() => {
    const modalContainer = document.getElementById('modal-container')
    modalContainer.style.borderRadius = '12px'
  }, [])

  return (
    <Modal className={styles.wrapper} isCloseBtnShown={false}>
      <div className={styles.content}>
        <AlertIcon className={styles.icon} />
        <h2 className={styles.title}>Cancel the Registration</h2>
        <p className={styles.text}>Are you sure you want to cancel?</p>
      </div>
      <div className={styles.buttons}>
        <Button danger small onClick={hideModal} className={styles.button}>
          Cancel
        </Button>
        <Button primaryGradient small onClick={handleClose} className={styles.button}>
          Exit Now
        </Button>
      </div>
    </Modal>
  )
}

export default CloseSDKModal
