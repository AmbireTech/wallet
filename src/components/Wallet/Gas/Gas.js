import RightPanel from './RightPanel/RightPanel'
import { Panel } from 'components/common'

import styles from './Gas.module.scss'
import LeftPanel from './LeftPanel/LeftPanel'

const Gas = ({ 
    selectedNetwork, 
    relayerURL, 
    portfolio, 
    selectedAccount, 
    userSorting, 
    setUserSorting, 
    gasTankState, 
    setGasTankState
 }) => {
    
    return (
        <section className={styles.wrapper}>
            <Panel className={styles.panel} title="Gas Tank">
                <LeftPanel
                    network={selectedNetwork}
                    relayerURL={relayerURL}
                    portfolio={portfolio}
                    account={selectedAccount}
                    gasTankState={gasTankState}
                    setGasTankState={setGasTankState}
                />
            </Panel>
            <Panel className={styles.panel}>
                { selectedNetwork.isGasTankAvailable ?
                    <RightPanel
                        network={selectedNetwork}
                        relayerURL={relayerURL}
                        portfolio={portfolio}
                        account={selectedAccount}
                        userSorting={userSorting}
                        setUserSorting={setUserSorting}
                        gasTankState={gasTankState}
                        setGasTankState={setGasTankState}
                    /> :
                    <h3 className="error">Gas Tank is not available on {selectedNetwork.id.toUpperCase()}</h3>
                }
            </Panel>
            
        </section>
    )
}

export default Gas
