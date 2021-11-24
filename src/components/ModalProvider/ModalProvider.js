import { createContext, useCallback, useState } from 'react'
import './ModalProvider.scss'

const ModalContext = createContext(null)

const ModalProvider = ({ children }) => {
    const [modal, setModal] = useState(null)
    const [backdropActive, setBackdropActive] = useState(true)

    const showModal = useCallback(element => setModal(element), [])
    const hideModal = useCallback(() => setModal(null), [])
    const deactivateBackdrop= useCallback(() => setBackdropActive(false), [])

    return (
        <ModalContext.Provider value={{ showModal, hideModal, deactivateBackdrop }}>
            { 
                modal ? 
                    <div id="modal-container">
                        <div className="backdrop" onClick={backdropActive ? hideModal : null}></div>
                        { modal }
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