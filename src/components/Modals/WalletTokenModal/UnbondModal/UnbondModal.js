import styles from './UnbondModal.module.scss'

import { createPortal } from 'react-dom'
import { Button } from 'components/common'
import { MdOutlineClose } from 'react-icons/md'
import Lottie from 'lottie-react'
import AnimationData from './assets/animation.json'
import Circle from './assets/circle.svg'
import cn from 'classnames'

const UnbondModal = ({ isVisible, hideModal, text, onClick }) => {
  const root = document.getElementById('root')
  
  return isVisible ? createPortal(
    <div className={styles.wrapper}>
      <div className={cn(styles.modal, 'modal')}>
        <div className={cn(styles.content, 'content')}>
          <div className={styles.dangerAnimationWrapper}>
            <Lottie className={styles.dangerAnimation} animationData={AnimationData} background="transparent" speed="1" loop autoplay />
            <img src={Circle} alt='circle' className={styles.dangerAnimationCircle} />
          </div>
          <span className={styles.warningTitle}>Warning</span>
          <p className={styles.warningText}>
            {text}
          </p>
        </div>
        <div className={styles.buttons}>
          <Button className={styles.button} danger onClick={onClick}>Yes, Claim anyway</Button>
          <Button className={styles.button} clear icon={<MdOutlineClose/>} onClick={hideModal}>Close</Button>
        </div>
      </div>
    </div>
  , root) : null
}

export default UnbondModal