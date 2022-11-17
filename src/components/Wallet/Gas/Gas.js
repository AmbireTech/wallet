import LeftPanel from './LeftPanel/LeftPanel'
import RightPanel from './RightPanel/RightPanel'

import styles from './Gas.module.scss'

const Gas = ({ 
    selectedNetwork, 
    relayerURL, 
    portfolio, 
    selectedAccount, 
    gasTankState, 
    setGasTankState
 }) => {
    
    return selectedNetwork.isGasTankAvailable ? (
        <section className={styles.wrapper}>
            <LeftPanel
                network={selectedNetwork}
                relayerURL={relayerURL}
                portfolio={portfolio}
                account={selectedAccount}
                gasTankState={gasTankState}
                setGasTankState={setGasTankState}
                panelClassName={styles.panel}
            />
            <RightPanel
                network={selectedNetwork}
                relayerURL={relayerURL}
                portfolio={portfolio}
                account={selectedAccount}
                gasTankState={gasTankState}
                setGasTankState={setGasTankState}
                panelClassName={styles.panel}
            /> 
        </section>
    ) : <h3 className="error">Gas Tank is not available on {selectedNetwork.id.toUpperCase()}</h3>
}

export default Gas
