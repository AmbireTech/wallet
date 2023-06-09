import { useContext } from 'react'
import { ToastContext } from 'context/ToastProvider/ToastProvider'

const useToasts = () => {
  return useContext(ToastContext)
}

export { useToasts }
