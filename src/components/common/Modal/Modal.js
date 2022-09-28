import './Modal.scss'

import { useModals } from 'hooks'

const Modal = ({ children, id, title, buttons, isCloseBtnShown = true, onClose, topLeft, className }) => {
    const { onHideModal } = useModals()

    const onCloseModal = () => {
        onHideModal()
        onClose && onClose()
    }

    return (
        <div id={id} className={`modal ${className || ''} ${buttons ? 'buttons' : ''}`}>
            <div className="heading">
                <div className={`title ${!isCloseBtnShown ? 'centered' : ''}`} style={topLeft ? { maxWidth: '360px' } : {}}>{ title }</div>
                {topLeft && <div className="top-left">{ topLeft }</div>}
                {isCloseBtnShown ? (<div className="close" onClick={onCloseModal}>
                    <img src="/resources/icons/close.svg" alt="close-icon" />
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
