import { Button } from 'components/common'

import { ReactComponent as Illustration } from './images/illustration.svg'

import styles from './BuyCrypto.module.scss'

const BuyCrypto = () => (
  <div className={styles.wrapper}>
    <h1 className={styles.title}>Do you want to buy crypto?</h1>
    <Illustration className={styles.illustration} />
    <div className={styles.buttons}>
      <Button size="sm" className={styles.button}>
        Buy Crypto with Fiat
      </Button>
      <Button variant="primaryGradient" size="sm" className={styles.button}>
        Finalize Registration
      </Button>
    </div>
  </div>
)

export default BuyCrypto
