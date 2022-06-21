import './CongratsRewardsModal.scss'

import { Button, Modal } from 'components/common'
import { MdOutlineClose } from 'react-icons/md'
import { useModals } from 'hooks'
import { useEffect } from 'react'
// import Particles from "react-tsparticles"
// import { loadFull } from "tsparticles"
import Confetti from 'react-confetti'

const CongratsRewardsModal = () => {
    const { hideModal } = useModals()


    // const particlesInit = async (main) => {
    //     console.log(main)
    
    //     // you can initialize the tsParticles instance (main) here, adding custom shapes or presets
    //     // this loads the tsparticles package bundle, it's the easiest method for getting everything ready
    //     // starting from v2 you can add only the features you need reducing the bundle size
    //     await loadFull()
    //   };
    
    //   const particlesLoaded = (container) => {
    //     console.log(container)
    //   };
    

    const modalButtons = <>
        <Button clear icon={<MdOutlineClose/>}>Close</Button>
    </>
    return (
        <>
        <Modal id="congrats-rewards-modal" title="CONGRATS" buttons={modalButtons}>
            <h1>CONGRATS</h1>
        </Modal>
        <Confetti
                width={window.screen.width}
                height={window.screen.height}
            />
        </>
        
    )
}

export default CongratsRewardsModal
