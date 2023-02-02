import './Modal.scss'

import { useModals } from 'hooks'
import cn from 'classnames'

import { ReactComponent as CloseIcon } from 'resources/icons/close.svg'
import { ReactComponent as BackIcon } from 'resources/icons/back.svg'

const Modal = ({ children, id, title, buttons, isCloseBtnShown = true, onClose, isBackBtnShown, onBack, topRight, className }) => {
    const { onHideModal } = useModals()

    const onCloseModal = () => {
        onHideModal()
        onClose && onClose()
    }

    return (
        <div id={id} className={cn('modal', className || '', { buttons: !!buttons })}>
            <div className="heading">
                {isBackBtnShown && <BackIcon className="heading-icon" onClick={onBack} />}
                <div className="title-wrapper">
                    <div className={cn('title', { centered: !isCloseBtnShown })} style={topRight ? { maxWidth: '360px' } : {}}>{ title }</div>
                    {topRight && <div>{ topRight }</div>}
                </div>
                {isCloseBtnShown && <CloseIcon className="heading-icon" onClick={onCloseModal} />}
            </div>
            <div className={cn("content", { noPaddingTop: !isCloseBtnShown })}>{ children }</div>
            { buttons ? 
                <div className="buttons">{ buttons }</div>
            : null}
        </div>
    )
}

export default Modal
