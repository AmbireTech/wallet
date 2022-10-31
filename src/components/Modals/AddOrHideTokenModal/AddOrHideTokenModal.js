import { useEffect, useState } from "react"

import { useModals } from "hooks"
import { Button, Modal } from "components/common"
import { Segments } from 'components/common'

import AddToken from "./AddToken/AddToken"
import HideToken from "./HideToken/HideToken"

import styles from './AddOrHideTokenModal.module.scss'

const segments = [{ value: 'Add Token' }, { value: 'Hide Token' }]

const AddOrHideTokenModal = ({ 
  setIsAddOrHideTokenModalOpen,
  network, account, portfolio,
  userSorting, sortType // HideToken
}) => {
  const [segment, setSegment] = useState(segments[0].value)

  const { hideModal, setOnClose } = useModals()

  const handleHideModal = () => {
    setIsAddOrHideTokenModalOpen(false)
    hideModal()
  }

  useEffect(() => {
    setOnClose({close: () => setIsAddOrHideTokenModalOpen(false)})
  }, [setOnClose, setIsAddOrHideTokenModalOpen])

  return (
    <Modal className={styles.modal} isCloseBtnShown={false} buttons={<Button onClick={handleHideModal} className={styles.closeButton}>Close</Button>}>
      <Segments small defaultValue={segment} segments={segments} onChange={(value) => setSegment(value)} />
      <div className={styles.body}>
        {
          segment === 'Add Token' ? <AddToken
            network={network}
            account={account}
            portfolio={portfolio}
          /> : <HideToken 
            network={network}
            account={account}
            portfolio={portfolio} 
            userSorting={userSorting}
            sortType={sortType}          
          />
        }
      </div>
    </Modal>
  )
}

export default AddOrHideTokenModal