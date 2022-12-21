import { networkIconsById } from 'consts/networks'
import { ReactComponent as SwapIcon } from 'resources/icons/cross-chain.svg'

import styles from './Networks.module.scss'

const Network = ({id, name}) => (
  <div className={styles.network}>
    <div className={styles.networkIconWrapper}>
      <img src={networkIconsById[id]} alt="" className={styles.networkIcon} />
    </div>
    <h3 className={styles.networkName}>{name}</h3>
  </div>
)

const Networks = ({fromNetworkName, fromNetworkId, toNetworkName, toNetworkId}) => {
  return (
    <div className={styles.wrapper}>
      <Network 
        id={fromNetworkId}
        name={fromNetworkName}
      />
      <SwapIcon className={styles.swapIcon} /> 
      <Network
        id={toNetworkId}
        name={toNetworkName}
      />
    </div>
  )
}

export default Networks
