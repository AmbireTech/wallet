import cn from 'classnames'

import { ReactComponent as SwapIcon } from 'resources/icons/cross-chain.svg'

import styles from './Networks.module.scss'

const Networks = ({ fromNetworkIcon, fromNetworkName, toNetworkIcon, toNetworkName }) => (
  <div className={styles.wrapper}>
    <SwapIcon className={styles.mobileSwapIcon} />
    {/* From Network */}
    <div className={styles.network}>
      <div className={styles.iconWrapper}>
        <img src={fromNetworkIcon} alt="" className={styles.icon} />
      </div>
      <div className={styles.networkName}>
        <p>From</p>
        <h4 className={styles.name}>{fromNetworkName}</h4>
      </div>
    </div>
    {/* To Network */}
    <div className={cn(styles.network, styles.toNetwork)}>
      <div className={styles.iconWrapper}>
        <img src={toNetworkIcon} alt="" className={styles.icon} />
      </div>
      <div className={styles.networkName}>
        <p>To</p>
        <h4 className={styles.name}>{toNetworkName}</h4>
      </div>
    </div>
  </div>
)

export default Networks
