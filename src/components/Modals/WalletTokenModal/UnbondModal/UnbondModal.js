import './UnbondModal.scss'

import { createPortal } from 'react-dom'
import { Button } from 'components/common'
import { MdOutlineClose } from 'react-icons/md'
import Lottie from 'lottie-react'
import AnimationData from './assets/animation.json'
import Circle from './assets/circle.svg'

const UnbondModal = ({ isVisible, hideModal }) => {
  const root = document.getElementById('root')
  return isVisible ? createPortal(
    <div id="unbond-modal">
      <div className='modal'>
        <div className='content'>
          <div className='danger-animation-wrapper'>
            <Lottie className='danger-animation' animationData={AnimationData} background="transparent" speed="1" loop autoplay />
            <img src={Circle} alt='circle' className='danger-animation-circle'/>
          </div>
          <span className='warning-title'>Warning</span>
          <p className='warning-text'>
            This procedure will claim only 50% of your outstanding 
            rewards as $WALLET, and permanently burn the rest. 
            Are you sure?
          </p>
        </div>
        <div className='buttons'>
          <Button className='button' danger onClick={() => console.log('Unbonded')}>Yes, Claim anyway</Button>
          <Button className='button' clear icon={<MdOutlineClose/>} onClick={hideModal}>Close</Button>
        </div>
      </div>
    </div>
  , root) : null
}

export default UnbondModal