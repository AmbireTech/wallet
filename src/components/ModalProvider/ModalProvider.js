import { createContext, useCallback, useState } from 'react'
import './ModalProvider.scss'

const ModalContext = createContext(null)

const ModalProvider = ({ children }) => {
    const [modal, setModal] = useState(null)
    
    const showModal = useCallback((element, opts = { disableClose: false }) => setModal({element, opts}), [])
    const hideModal = useCallback(() => setModal(null), [])
    
    return (
        <ModalContext.Provider value={{ showModal, hideModal }}>
            { 
                modal ? 
                    <div id="modal-container">
                        <div className="backdrop" onClick={modal.opts.disableClose ? null : hideModal }></div>
                        { modal.element }
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