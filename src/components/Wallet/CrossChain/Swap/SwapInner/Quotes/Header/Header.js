import TxStatusComponent from 'components/Wallet/CrossChain/TxStatusComponent/TxStatusComponent'

import styles from './Header.module.scss'

const Header = ({ fromNetwork, fromAsset, toNetwork, toAsset, amount }) => (
  <TxStatusComponent
    fromNetworkIcon={fromNetwork.icon}
    fromNetworkName={fromNetwork.name}
    toNetworkIcon={toNetwork.icon}
    toNetworkName={toNetwork.name}
    fromTokenName={fromAsset.symbol}
    fromTokenAmount={amount}
    fromTokenIcon={fromAsset.icon}
    toTokenName={toAsset.symbol}
    toTokenAmount=""
    toTokenIcon={toAsset.icon}
    className={styles.wrapper}
  />
)

export default Header
