import { useCallback, useEffect, useState } from 'react'
import { Button, Modal } from 'components/common'
import { useReward } from 'react-rewards'

import styles from './CongratsRewardsModal.module.scss'

const CongratsRewardsModal = ({ pendingTokensTotal }) => {
    const { reward, isAnimating } = useReward('rewardId', 'confetti')
    const [count, setCount] = useState(0)
    const initialRewardsCount = 3
    const playReward = useCallback(() => {
        return reward()
    }, [reward])

    useEffect(() => {
        if (count < initialRewardsCount && !isAnimating ) {
            playReward()
            setCount(prevState => prevState += 1)
        }
    }, [count, isAnimating, playReward])
    
    const modalButtons = <>
        <Button disabled={isAnimating} onClick={reward}>More confetti</Button>
    </>

    return (
        <>
            <Modal className={styles.wrapper} title="Woo-hoo!" buttons={modalButtons}>
                <div className={styles.content}>
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
