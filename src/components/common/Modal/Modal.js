import './Modal.scss'

import { MdClose } from 'react-icons/md'
import { useModals } from 'hooks'

const Modal = ({ children, id, title, buttons, isCloseBtnShown = true, onClose }) => {
    const { hideModal } = useModals()

    const onCloseModal = () => {
        hideModal()
        onClose && onClose()
    }

    return (
        <div id={id} className={`modal ${buttons ? 'buttons' : ''}`}>
            <div className="heading">
                <div className="title">{ title }</div>
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
