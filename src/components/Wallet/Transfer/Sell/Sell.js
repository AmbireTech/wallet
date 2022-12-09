import styles from './Sell.module.scss'
import Providers from 'components/Wallet/Deposit/Providers/Providers'

const Sell = ({ walletAddress, networkDetails, relayerURL, portfolio, selectedAsset }) => {
  return (
    <div className={styles.wrapper}>
      <Providers
        walletAddress={walletAddress}
        networkDetails={networkDetails}
        relayerURL={relayerURL}
        portfolio={portfolio}
        sellMode={true}
        selectedAsset={selectedAsset} />
    </div>
  )
}

export default Sell