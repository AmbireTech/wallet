import cn from 'classnames'

import { useSDKContext } from 'components/SDKProvider/SDKProvider'
import AccountAndNetworkComponent from 'components/common/AccountAndNetwork/AccountAndNetwork'

import styles from './AccountAndNetwork.module.scss'

const AccountAndNetwork = ({ account, accountAvatar, network }) => {
  const { isSDK } = useSDKContext()

  return (
    <div className={cn(styles.wrapper, {[styles.sdk]: isSDK})}>
      <h2 className={styles.title}>Signing With</h2>
      <AccountAndNetworkComponent
        address={account.id}
        email={account.email}
        networkName={network.name}
        networkId={network.id}
        avatar={accountAvatar}
        maxAddressLength={0}
      />
    </div>
  )
}

export default AccountAndNetwork
