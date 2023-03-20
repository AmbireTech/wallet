import { useContext } from "react"
import { ConstantsContext } from "context/ConstantsProvider/ConstantsProvider"

export default function useConstants() {
  const context = useContext(ConstantsContext)

  if (!context) {
    throw new Error('useConstants must be used within an ConstantsProvider')
  }

  return context
}