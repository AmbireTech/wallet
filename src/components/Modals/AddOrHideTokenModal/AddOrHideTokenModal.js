import { Modal } from "components/common"
import AddToken from "./AddToken/AddToken"
import HideToken from "./HideToken/HideToken"

const AddOrHideTokenModal = () => {
  return (
    <Modal>
      <AddToken />
      <HideToken />  
    </Modal>
  )
}

export default AddOrHideTokenModal