import TxStatusComponent from 'components/Wallet/CrossChain/TxStatusComponent/TxStatusComponent'

import styles from './Summary.module.scss'

const Summary = ({
  fromNetwork,
  fromAsset,
  toNetwork,
  toAsset
}) => (
  <TxStatusComponent
    fromNetworkIcon={fromNetwork.icon}
    fromNetworkName={fromNetwork.name}
    toNetworkIcon={toNetwork.icon}
    toNetworkName={toNetwork.name}
    fromTokenName=""
    fromTokenAmount={fromAsset.symbol}
    fromTokenIcon={fromAsset.icon}
    toTokenName={toAsset.symbol}
    toTokenAmount=""
    toTokenIcon={toAsset.icon}
    className={styles.wrapper}
  />
)

export default Summary
