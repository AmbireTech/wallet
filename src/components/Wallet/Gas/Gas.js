import './Gas.scss'

import GasDetails from './GasDetails/GasDetails'
import GasTank from './GasTank/GasTank'
import { useState, useEffect } from 'react'
import { useRelayerData } from 'hooks'
import { Loading, Panel } from 'components/common'

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
    const [cacheBreak, setCacheBreak] = useState(() => Date.now())

    useEffect(() => {
        if (Date.now() - cacheBreak > 5 * 1000) setCacheBreak(Date.now())
        const intvl = setTimeout(() => setCacheBreak(Date.now()), 60 * 1000)
        return () => clearTimeout(intvl)
    }, [cacheBreak])

    const url = relayerURL ? `${relayerURL}/gasPrice/${selectedNetwork.id}?cacheBreak=${cacheBreak}` : null
    //TODO: To implement "isLoading" and "errMsg"
    const { data, errMsg, isLoading } = useRelayerData({ url })
    
    const gasData = data ? data.data : null
    
    return (
        <section id="gas">
            <Panel className="panel">
                <div className="heading">
                    <div className="title">Current Network Fees</div>
                </div>
                <div className="description">
                    <p>Network fees are determined on a market principle - if more users are trying to use the network, fees are higher. Each network has different fees.</p>
                    { gasData && !isLoading && <GasDetails gasData={gasData} />  }
                    { isLoading && <Loading /> }
                    { !gasData && errMsg && (
                        <h3 className="error">Gas Information: {errMsg}</h3>
                    )}
                </div>
            </Panel>
            
            <Panel className="panel">
                <div className="heading">
                    <div className="title">Gas Tank</div>
                </div>
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
