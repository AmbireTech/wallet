import './UnbondModal.scss'

import { createPortal } from 'react-dom'
import { Button } from 'components/common'
import { MdClose, MdOutlineClose } from 'react-icons/md'

const UnbondModal = ({ isVisible, hideModal }) => {
  const root = document.getElementById('root')
  return isVisible ? createPortal(
    <div id="unbond-modal">
      <div className='modal'>
        <div className='heading'>
          <div className="title">This is a test modal</div>
          <div className="close" onClick={hideModal}>
            <MdClose/>
          </div>
        </div>
        <div className='content'>
          <p>This is content</p>
        </div>
        <div className='buttons'>
          <Button danger icon={<MdOutlineClose/>} onClick={() => console.log('Unbonded')}>Unbond</Button>
          <Button clear icon={<MdOutlineClose/>} onClick={hideModal}>Close</Button>
        </div>
      </div>
    </div>
  , root) : null
}

export default UnbondModal