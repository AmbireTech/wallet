import { useLocalStorage } from 'hooks'
import History from './History/History'
import Swap from './Swap/Swap'
import OfflineWrapper from 'components/OfflineWrapper/OfflineWrapper'

import styles from './CrossChain.module.scss'

export const formatAmount = (amount, asset) => {
  let decimals = 4
  const formatedAmount = amount / 10 ** asset.decimals

  if (formatedAmount < 100) {
    decimals = 5
  }

  // Remove trailing zeros
  return formatedAmount.toFixed(decimals).replace(/0+$/, '').replace(/[.]$/, '')
}

const CrossChain = ({ addRequest, selectedAccount, portfolio, network, relayerURL }) => {
  const [quotesConfirmed, setQuotesConfirmed] = useLocalStorage({
    key: 'quotesConfirmed',
    defaultValue: []
  })

  return (
    <OfflineWrapper>
      <div className={styles.wrapper}>
        <Swap 
            network={network}
            portfolio={portfolio}
            addRequest={addRequest}
            selectedAccount={selectedAccount}
            quotesConfirmed={quotesConfirmed}
            setQuotesConfirmed={setQuotesConfirmed}
            panelClassName={styles.panel}
        />
        <History
            network={network}
            account={selectedAccount}
            quotesConfirmed={quotesConfirmed}
            relayerURL={relayerURL}
            panelClassName={styles.panel}
        />
      </div>
    </OfflineWrapper>
  )
}

export default CrossChain
