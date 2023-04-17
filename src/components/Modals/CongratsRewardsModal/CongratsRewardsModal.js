// import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'
import { useModals } from 'hooks'

import { Button, Modal } from 'components/common'
import AnimationData from './assets/confetti-animation.json'
import WalletTokenCongratsImage from './assets/wallet-token-congrats.png'

import styles from './CongratsRewardsModal.module.scss'

const CongratsRewardsModal = ({ pendingTokensTotal }) => {
    const { hideModal } = useModals()

    return (
        <Modal 
            size="sm"
            className={styles.wrapper} 
            contentClassName={styles.content} 
            title="Woo-hoo!" 
            isCloseBtnShown={false} 
            buttons={<Button onClick={hideModal}>Close</Button>}
        >
            <Lottie className={styles.confettiAnimation} animationData={AnimationData} background="transparent" speed="1" loop={false} autoplay />
            <img className={styles.image} src={WalletTokenCongratsImage} alt="wallet-congrats" />
            <h2 className={styles.title}>You just received { pendingTokensTotal } $WALLET!</h2>
            <p className={styles.text}>
                You have a balance of $1,000 or more in your Ambire wallet - this means you are eligible to earn WALLET rewards!<br/>
                The bigger your account balance, the more rewards you earn, and you can claim them every Monday.
            </p>
            <a 
                href='https://blog.ambire.com/wallet-rewards-mechanism-explained-start-accumulating-value-before-the-token-is-launched/' 
                target='_blank' 
                rel='noreferrer'
                className={styles.link}
            >
                Learn more about WALLET rewards
            </a>   
        </Modal>
    )
}

export default CongratsRewardsModal
