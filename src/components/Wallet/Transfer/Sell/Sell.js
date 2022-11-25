import styles from './Sell.module.scss'
// eslint-disable-next-line import/no-relative-parent-imports
import Providers from '../../Deposit/Providers/Providers'

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