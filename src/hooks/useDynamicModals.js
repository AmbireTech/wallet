import { useContext, useEffect, useRef } from 'react'
import { ModalContext } from 'context/ModalProvider/ModalProvider'

const useDynamicModal = (component, props, watchProps = {}, opts) => {
  const { showDynamicModal, updateModal } = useContext(ModalContext)
  const previousWatchProps = useRef(watchProps)

  useEffect(() => {
    if (JSON.stringify(previousWatchProps.current) !== JSON.stringify(watchProps)) {
      updateModal(watchProps)
      previousWatchProps.current = watchProps
    }
  }, [watchProps, updateModal])

  return () => showDynamicModal(component, { ...props, ...watchProps }, opts)
}

export default useDynamicModal
