/* eslint-disable import/no-cycle */
import cn from 'classnames'

import { useModals } from 'hooks'

import { ReactComponent as CloseIcon } from 'resources/icons/close.svg'
import { ReactComponent as BackIcon } from 'resources/icons/back.svg'

import styles from './Modal.module.scss'

const Modal = ({
  children,
  title,
  buttons,
  size,
  isCloseBtnShown = true,
  onClose,
  isBackBtnShown,
  onBack,
  className,
  buttonsClassName,
  contentClassName
}) => {
  const { onHideModal } = useModals()

  const onCloseModal = () => {
    onHideModal()
    onClose && onClose()
  }

  return (
    <div className={cn(styles.wrapper, className, styles[size || ''])}>
      {title || isCloseBtnShown || isBackBtnShown ? (
        <div className={styles.heading}>
          {isBackBtnShown && <BackIcon className={styles.headingIcon} onClick={onBack} />}
          <h2
            className={cn(styles.title, { [styles.centered]: !isCloseBtnShown && !isBackBtnShown })}
          >
            {title}
          </h2>
          {isCloseBtnShown && <CloseIcon className={styles.headingIcon} onClick={onCloseModal} />}
        </div>
      ) : null}
      <div className={cn(styles.content, contentClassName)}>{children}</div>
      {buttons && <div className={cn(styles.buttons, buttonsClassName)}>{buttons}</div>}
    </div>
  )
}

export default Modal
