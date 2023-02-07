import { createContext, useCallback, useState } from 'react'

import styles from './ModalProvider.module.scss'

const ModalContext = createContext(null)

const ModalProvider = ({ children }) => {
    const [modal, setModal] = useState(null)
    const [onClose, setOnClose] = useState(null)
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
        onClose?.close && onClose?.close()
        setDynamicModal(null)
        setBeforeCloseModalHandler(null)
    }, [onClose])

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
        <ModalContext.Provider value={{ showModal, showDynamicModal, hideModal, onHideModal, updateModal, beforeCloseModalHandler, setBeforeCloseModalHandler, setOnClose }}>
            {
                modal ?
                    <div className={styles.wrapper}>
                        <div className={styles.backdrop} onClick={modal.opts.disableClose ? null : onHideModal }></div>
                        { modal.element }
                    </div>
                    :
                    null
            }
            {
                dynamicModal ?
                    <div className={styles.wrapper}>
                        <div className={styles.backdrop} onClick={dynamicModal.opts && dynamicModal.opts.disableClose ? null : onHideModal }></div>
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