import './CongratsRewardsModal.scss'

import { useEffect, useState } from 'react'
import { Button, Modal } from 'components/common'
import { useReward } from 'react-rewards'

const CongratsRewardsModal = ({ pendingTokensTotal }) => {
    const { reward, isAnimating } = useReward('rewardId', 'confetti')
    const [count, setCount] = useState(0)
    const initialRewardsCount = 3

    useEffect(() => {
        if (count < initialRewardsCount && !isAnimating ) {
            reward()
            setCount(prevState => prevState += 1)
        }
    }, [count, isAnimating, reward])
    
    const modalButtons = <>
        <Button disabled={isAnimating} onClick={reward}>More confetti</Button>
    </>

    return (
        <>
            <Modal id="congrats-rewards-modal" title="Woo-hoo!" buttons={modalButtons}>
                <div className='content'>
                    <div id="rewardId" />
                    <div className='wallet-logo'></div>
                    <h2>You just received { pendingTokensTotal } $WALLET!</h2>
                    <p>You have a balance of $1,000 or more in your Ambire wallet - this means you are eligible to earn WALLET rewards!
                    The bigger your account balance, the more rewards you earn, and you can claim them every Monday.</p>
                    <a href='https://blog.ambire.com/tagged/wallet-rewards' target='_blank' rel='noreferrer'>Learn more about WALLET rewards</a>   
                </div>
            </Modal>
        </>   
    )
}

export default CongratsRewardsModal
