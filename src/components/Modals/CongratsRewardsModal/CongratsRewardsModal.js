import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'
import { Button, Modal } from 'components/common'
import AnimationData from './assets/confetti-animation.json'

import styles from './CongratsRewardsModal.module.scss'

const CongratsRewardsModal = ({ pendingTokensTotal }) => {
    const [count, setCount] = useState(0)
    const initialRewardsCount = 3

    useEffect(() => {
        if (count < initialRewardsCount ) {
            setCount(prevState => prevState += 1)
        }
    }, [count])

    return (
        <>
            <Modal className={styles.wrapper} title="Woo-hoo!" buttons={<Button>More confetti</Button>}>
                <Lottie className={styles.confettiAnimation} animationData={AnimationData} background="transparent" speed="1" loop autoplay />
                <div className={styles.innerContent}>
                    <div id="rewardId" className={styles.reward} />
                    <div className={styles.logo}></div>
                    <h2>You just received { pendingTokensTotal } $WALLET!</h2>
                    <p>You have a balance of $1,000 or more in your Ambire wallet - this means you are eligible to earn WALLET rewards!</p>
                    <p>The bigger your account balance, the more rewards you earn, and you can claim them every Monday.</p>
                    <a href='https://blog.ambire.com/wallet-rewards-mechanism-explained-start-accumulating-value-before-the-token-is-launched/' target='_blank' rel='noreferrer'>Learn more about WALLET rewards</a>   
                </div>
            </Modal>
        </>   
    )
}

export default CongratsRewardsModal
