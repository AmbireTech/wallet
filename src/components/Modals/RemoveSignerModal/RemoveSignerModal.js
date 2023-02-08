import Lottie from 'lottie-react'
import { Button, Modal } from "components/common"
import { useModals } from "hooks"

import AnimationData from './assets/astronaut-animation.json'
import styles from './RemoveSignerModal.module.scss'

const RemoveSignerModal = ({ onClick,  }) => {
  const { hideModal } = useModals()

  return (
    <Modal 
      title="Remove Signer"
      buttons={<>
        <Button border onClick={hideModal}>
          Cancel
        </Button>
        <Button border className={styles.removeButton} onClick={() => {
          hideModal()
          onClick()
        }}>
          Remove
        </Button>
      </>}
      isCloseBtnShown={false}
      className={styles.wrapper}
    >
      <Lottie className={styles.animation} animationData={AnimationData} background="transparent" speed="1" loop autoplay />
      <p className={styles.text}>Are you sure you want to remove this signer?</p>
    </Modal>
  )
}

export default RemoveSignerModal