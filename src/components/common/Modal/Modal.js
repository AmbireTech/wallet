import './Modal.scss'

import { useModals } from 'hooks'
import cn from 'classnames'

import { ReactComponent as CloseIcon } from 'resources/icons/close.svg'

const Modal = ({ children, id, title, buttons, isCloseBtnShown = true, onClose, topRight, className }) => {
    const { onHideModal } = useModals()

    const onCloseModal = () => {
        onHideModal()
        onClose && onClose()
    }

    return (
        <div id={id} className={cn('modal', className || '', { buttons: !!buttons })}>
            <div className="heading">
                <div className="title-wrapper">
                    <div className={cn('title', { centered: !isCloseBtnShown })} style={topRight ? { maxWidth: '360px' } : {}}>{ title }</div>
                    {topRight && <div>{ topRight }</div>}
                </div>
                {isCloseBtnShown ? (<div className="close" onClick={onCloseModal}>
                    <CloseIcon />
                </div>) : <></>}
            </div>
            <div className={cn("content", { noPaddingTop: !isCloseBtnShown })}>{ children }</div>
            { buttons ? 
                <div className="buttons">{ buttons }</div>
            : null}
        </div>
    )
}

export default Modal
