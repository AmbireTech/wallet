import './Gas.scss'

import GasDetails from './GasDetails/GasDetails'
import GasTank from './GasTank/GasTank'
import { useState, useEffect } from 'react'
import { useRelayerData } from 'hooks'

const Gas = ({ selectedNetwork, relayerURL }) => {
    const [cacheBreak, setCacheBreak] = useState(() => Date.now())

    useEffect(() => {
        if (Date.now() - cacheBreak > 5 * 1000) setCacheBreak(Date.now())
        const intvl = setTimeout(() => setCacheBreak(Date.now()), 60 * 1000)
        return () => clearTimeout(intvl)
    }, [cacheBreak])

    const url = relayerURL ? `${relayerURL}/gasPrice/${selectedNetwork.id}?cacheBreak=${cacheBreak}` : null
    //TODO: To implement "isLoading" and "errMsg"
    const { data, errMsg, isLoading } = useRelayerData(url)
    
    const gasData = data ? data.data : null
    
    return (
        <section id="gas">
            <div className="panel">
                <div className="heading">
                    <div className="title">Gas Information</div>
                </div>
                <div className="description">
                    {gasData && <GasDetails gasData={gasData} />}
                </div>
            </div>
            <div className="panel">
                <div className="heading">
                    <div className="title">Gas Tank</div>
                </div>
                <div className="description">
                    <GasTank></GasTank>
                </div>
            </div>
        </section>
    )
}

export default Gas
