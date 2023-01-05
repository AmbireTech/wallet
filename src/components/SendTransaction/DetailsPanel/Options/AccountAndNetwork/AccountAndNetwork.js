import AccountAndNetworkComponent from 'components/common/AccountAndNetwork/AccountAndNetwork'

import styles from './AccountAndNetwork.module.scss'

const AccountAndNetwork = ({ account, accountAvatar, network }) => (
  <div className={styles.wrapper}>
    <h2 className={styles.title}>Signing With</h2>
    <AccountAndNetworkComponent
      address={account.id}
      networkName={network.name}
      networkId={network.id}
      avatar={accountAvatar}
      maxAddressLength={0}
    />
  </div>
)

export default AccountAndNetwork
