import './Modal.scss'

import { MdClose } from 'react-icons/md'
import { useModals } from 'hooks'

const Modal = ({ children, id, title, buttons, isCloseBtnShown = true, onClose, topLeft }) => {
    const { onHideModal } = useModals()

    const onCloseModal = () => {
        onHideModal()
        onClose && onClose()
    }

    return (
        <div id={id} className={`modal ${buttons ? 'buttons' : ''}`}>
            <div className="heading">
                <div className="title"  style={topLeft ? { maxWidth: '360px' } : {}}>{ title }</div>
                {topLeft && <div className="top-left">{ topLeft }</div>}
                {isCloseBtnShown ? (<div className="close" onClick={onCloseModal}>
                    <MdClose/>
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
