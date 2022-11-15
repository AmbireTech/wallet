import GasTank from './GasTank/GasTank'

import './Gas.scss'
import { Panel } from 'components/common'

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
        <section id="gas">
            
            <Panel className="panel" title="Gas Tank">
                <div className="description">
                { selectedNetwork.isGasTankAvailable ?
                    <GasTank
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
                </div>
            </Panel>
            
        </section>
    )
}

export default Gas
