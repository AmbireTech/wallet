import { useContext } from 'react'
import { ModalContext } from 'context/ModalProvider/ModalProvider'

const useModals = () => useContext(ModalContext)
export default useModals
