import './CongratsRewardsModal.scss'

import { Button, Modal } from 'components/common'
import { MdOutlineClose } from 'react-icons/md'
import { useModals } from 'hooks'
import Confetti from 'react-confetti'

const CongratsRewardsModal = () => {
    const { hideModal } = useModals()
    const drawing = new Image()
    drawing.src = "https://raw.githubusercontent.com/AmbireTech/ambire-brand/main/logos/Ambire_logo_250x250.png"
    
    const modalButtons = <>
        <Button clear icon={<MdOutlineClose/>} onClick={hideModal}>Close</Button>
    </>
    return (
        <>
            <Modal id="congrats-rewards-modal" title="Woo-hoo!" buttons={modalButtons}>
                <div className='heading'>
                    <div className='title'>You just received X $WALLET!</div>
                </div>
                <div className='content'>
                    <p>You have a balance of $1,000 or more in your Ambire wallet - this means you are eligible to earn WALLET rewards!
                    The bigger your account balance, the more rewards you earn, and you can claim them every Monday.</p>
                    <a href='https://blog.ambire.com/tagged/wallet-rewards' target='_blank' rel='noreferrer'>Learn more about WALLET rewards</a>   
                </div>
            </Modal>
            <Confetti
                    drawShape={ctx => ctx.drawImage(drawing, 0, 0, 30, 30)}
                    width={window.screen.width}
                    height={window.screen.height}
                    // numberOfPieces={1000}
                    gravity={0.03}
            />
        </>
        
    )
}

export default CongratsRewardsModal
