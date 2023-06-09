import { networkIconsById } from 'consts/networks'

import styles from './AccountAndNetwork.module.scss'

const formatAddress = (fullStr, strLen) => {
  if (fullStr.length <= strLen || strLen === 0) return fullStr

  const separator = '...'

  const charsToShow = strLen - separator.length
  const frontChars = Math.ceil(charsToShow / 2)
  const backChars = Math.floor(charsToShow / 2)

  return fullStr.substr(0, frontChars) + separator + fullStr.substr(fullStr.length - backChars)
}

const AccountAndNetwork = ({ address, avatar, networkName, networkId, maxAddressLength = 20 }) => (
  <div className={styles.wrapper}>
    <div className={styles.account}>
      <img className={styles.avatar} alt="avatar" src={avatar} />
      <p className={styles.address}>{formatAddress(address, maxAddressLength)}</p>
    </div>
    <p className={styles.network}>
      on {networkName}
      <img className={styles.icon} src={networkIconsById[networkId]} alt={networkName} />
    </p>
  </div>
)

export default AccountAndNetwork
