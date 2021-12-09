import './Modal.scss'

import { MdClose } from 'react-icons/md'
import { useModals } from '../../../hooks'

const Modal = ({ children, id, title, buttons, isCloseBtnShown = true }) => {
    const { hideModal } = useModals()

    return (
        <div id={id} className="modal">
            <div className="heading">
                <div className="title">{ title }</div>
                {isCloseBtnShown ? (<div className="close" onClick={hideModal}>
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
