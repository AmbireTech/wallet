import { networkIconsById } from 'consts/networks'

import styles from './AccountAndNetwork.module.scss'

const formatAddress = (fullStr, strLen) => {
  if (fullStr.length <= strLen) return fullStr
  
  const separator = '...'

  const charsToShow = strLen - separator.length
  const frontChars = Math.ceil(charsToShow / 2)
  const backChars = Math.floor(charsToShow / 2)

  return fullStr.substr(0, frontChars) + separator + fullStr.substr(fullStr.length - backChars)
}

const AccountAndNetwork = ({ account, accountAvatar, network }) => (
  <div className={styles.wrapper}>
    <h2 className={styles.title}>Signing With</h2>
    <div className={styles.body}>
      <div className={styles.account}>
        <img className={styles.avatar} alt="avatar" src={accountAvatar} />
        <p className={styles.address}>{formatAddress(account.id, 27)}</p>
      </div>
      <p className={styles.network}>
        on {network.name}
        <img className={styles.icon} src={networkIconsById[network.id]} alt={network.name} />
      </p>
    </div>
  </div>
)

export default AccountAndNetwork
