import { useContext } from 'react'
import { ModalContext } from 'components/ModalProvider/ModalProvider'

const useModals = () => useContext(ModalContext)
export default useModals