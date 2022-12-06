import { useEffect, useState } from "react"

import { useModals } from "hooks"
import { Button, Modal } from "components/common"
import { Segments } from 'components/common'

import AddCollectible from "./AddCollectible/AddCollectible"
import HideCollectible from "./HideCollectible/HideCollectible"

import styles from './AddOrHideCollectibleModal.module.scss'

const segments = [{ value: 'Add Collectible' }, { value: 'Hide Collectible' }]

const AddOrHideCollectibleModal = ({ 
  defaultSection,
  handleModalVisiblity,
  network, account,
  portfolio,
  handleUri
}) => {
  const [segment, setSegment] = useState(defaultSection || segments[0].value)

  const { hideModal, setOnClose } = useModals()

  const handleHideModal = () => {
    handleModalVisiblity(false)
    hideModal()
  }

  useEffect(() => {
    setOnClose({close: () => handleModalVisiblity(false)})
  }, [setOnClose, handleModalVisiblity])

  return (
    <Modal className={styles.modal} isCloseBtnShown={false} buttons={<Button onClick={handleHideModal} className={styles.closeButton}>Close</Button>}>
      <Segments small defaultValue={segment} segments={segments} onChange={(value) => setSegment(value)} />
      <div className={styles.body}>
        {
          segment === 'Add Collectible' ? <AddCollectible
            network={network}
            account={account}
            portfolio={portfolio}
            handleUri={handleUri}
          /> : <HideCollectible
            network={network}
            account={account}
            portfolio={portfolio} 
            handleUri={handleUri}         
          />
        }
      </div>
    </Modal>
  )
}

export default AddOrHideCollectibleModal