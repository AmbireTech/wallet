import { useLocalStorage } from 'hooks'

import History from './History/History'
import Swap from './Swap/Swap'

import styles from './CrossChain.module.scss'

const CrossChain = ({ addRequest, selectedAccount, portfolio, network, relayerURL }) => {
    const [quotesConfirmed, setQuotesConfirmed] = useLocalStorage({ key: 'quotesConfirmed', defaultValue: [] })

    return (
        <div className={styles.wrapper}>
            <Swap 
                network={network}
                portfolio={portfolio}
                addRequest={addRequest}
                selectedAccount={selectedAccount}
                quotesConfirmed={quotesConfirmed}
                setQuotesConfirmed={setQuotesConfirmed}
            />
            <History
                network={network}
                account={selectedAccount}
                quotesConfirmed={quotesConfirmed}
                relayerURL={relayerURL}
            />
        </div>
    )
}

export default CrossChain
