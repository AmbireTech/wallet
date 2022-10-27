import './Modal.scss'

import { useModals } from 'hooks'
import cn from 'classnames'

import { ReactComponent as CloseIcon } from 'resources/icons/close.svg'

const Modal = ({ children, id, title, buttons, isCloseBtnShown = true, onClose, topLeft, className }) => {
    const { onHideModal } = useModals()

    const onCloseModal = () => {
        onHideModal()
        onClose && onClose()
    }

    return (
        <div id={id} className={cn('modal', className || '', { buttons: !!buttons })}>
            <div className="heading">
                <div className={cn('title', { centered: !isCloseBtnShown })} style={topLeft ? { maxWidth: '360px' } : {}}>{ title }</div>
                {topLeft && <div className="top-left">{ topLeft }</div>}
                {isCloseBtnShown ? (<div className="close" onClick={onCloseModal}>
                    <CloseIcon />
                </div>) : <></>}
            </div>
            <div className="content">{ children }</div>
            { buttons ? 
                <div className="buttons">{ buttons }</div>
            : null}
        </div>
    )
}

export default Modal
