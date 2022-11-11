import { networkIconsById } from 'consts/networks'

import styles from './AccountAndNetwork.module.scss'

const AccountAndNetwork = ({
  account,
  accountAvatar,
  network
}) => (
  <div className={styles.wrapper}>
    <h2 className={styles.title}>Signing With</h2>
    <div className={styles.body}>
      <div className={styles.account}>
        <img
          className={styles.avatar}
          alt="avatar"
          src={accountAvatar}
        />
        <p className={styles.address}>{account.id}</p>
      </div>
      <p className={styles.network}>
        on {network.name}
        <img
          className={styles.icon}
          src={networkIconsById[network.id]}
          alt={network.name}
        />
      </p>
    </div>
  </div>
)

export default AccountAndNetwork