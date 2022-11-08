import cn from 'classnames'
import useProviders from 'components/Wallet/Deposit/Providers/useProviders'
import { Loading } from 'components/common'
import GUARDARIAN_LOGO from 'resources/payment-providers/guardarian.svg'
import styles from './Sell.module.scss'

const Sell = ({ walletAddress, networkDetails, relayerURL, portfolio }) => {
  const networks = ['ethereum', 'polygon', 'binance-smart-chain', 'fantom']

  const { openGuardarian, isLoading } = useProviders({ walletAddress, selectedNetwork: networkDetails.id, relayerURL, portfolio })

  const shouldBeDisabled = (networks) => networks.includes(networkDetails.id)

  const handleSell = () => openGuardarian('sell')

  return (
    <div className={styles.wrapper}>
      <div className={cn(styles.provider, { [styles.disabled]: !shouldBeDisabled(networks) })} onClick={handleSell}>
          <div className={styles.logo}>
            <img src={GUARDARIAN_LOGO} alt='guardarian-logo'></img>
          </div>
          { isLoading.includes('Guardarian') ? <div><Loading/></div> :
          <div className={styles.details}>
              <div className={styles.type}>
                Buy with Bank Transfer, Credit/Debit Card, Sell Crypto
              </div>
              <div className={styles.fees}>
                Fees: from 2%
              </div>
              <div className={styles.limits}>
                Limits: up to 15k EUR/monthly on and off ramp
              </div>
              <div className={styles.currencies}>
                Currencies: GBP, EUR, USD and many more
              </div>
          </div>
          }
      </div>
    </div>
  )
}

export default Sell