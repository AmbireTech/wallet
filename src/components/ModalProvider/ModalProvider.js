import { createContext, useCallback, useState } from 'react'
import './ModalProvider.scss'

const ModalContext = createContext(null)

const ModalProvider = ({ children }) => {
    const [modal, setModal] = useState(null)
    const [dynamicModal, setDynamicModal] = useState(null)
    const [beforeCloseModalHandler, setBeforeCloseModalHandler] = useState(null)

    const showModal = useCallback((element, opts = { disableClose: false }) => {
        setBeforeCloseModalHandler(null)
        setDynamicModal(null)
        setModal({element, opts})
    }, [])

    const showDynamicModal = useCallback((component, props, opts = { disableClose: false }) => {
        setBeforeCloseModalHandler(null)
        setModal(null)
        setDynamicModal({ component, props, opts })
    }, [])

    const hideModal = useCallback(() => {
        setModal(null)
        setDynamicModal(null)
        setBeforeCloseModalHandler(null)
    }, [])

    // intercept non explicit hide modal
    const onHideModal = useCallback(() => {
        if (beforeCloseModalHandler) {
            beforeCloseModalHandler()
        } else {
            hideModal()
        }
    }, [hideModal, beforeCloseModalHandler])

    const updateModal = useCallback(props => 
        setDynamicModal(dynamicModal => dynamicModal ? ({
            ...dynamicModal,
            props: {
                ...dynamicModal.props,
                ...props
            }
        }) : null)
    , [])
    
    return (
        <ModalContext.Provider value={{ showModal, showDynamicModal, hideModal, onHideModal, updateModal, beforeCloseModalHandler, setBeforeCloseModalHandler }}>
            {
                modal ?
                    <div id="modal-container">
                        <div className="backdrop" onClick={modal.opts.disableClose ? null : onHideModal }></div>
                        { modal.element }
                    </div>
                    :
                    null
            }
            {
                dynamicModal ?
                    <div id="modal-container">
                        <div className="backdrop" onClick={dynamicModal.opts && dynamicModal.opts.disableClose ? null : onHideModal }></div>
                        <dynamicModal.component {...dynamicModal.props} />
                    </div>
                    :
                    null
            }
            { children }
        </ModalContext.Provider>
    )
}

export { ModalContext }
export default ModalProvider