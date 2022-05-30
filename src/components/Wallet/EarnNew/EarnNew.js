import './Earn.scss'

import { useState } from 'react'
import { Loading } from 'components/common'
import TokensList from './Cards/TokensList/TokensList'
import StrategiesList from './Cards/StrategiesList/StrategiesList'
import DepositCard from './Cards/DepositCard/DepositCard'

const Earn = ({ portfolio, selectedNetwork, rewardsData, selectedAcc, addRequest, relayerURL }) => {
    const [selectedToken, setSelectedToken] = useState('')
    const [selectedStrategie, setSelectedStrategie] = useState('')

    return (
        <div id="earn">
            {
                portfolio.isCurrNetworkBalanceLoading ?
                    <Loading/>
                    :
                    <div className="cards">
                       <TokensList
                            networkId={selectedNetwork.id}
                            accountId={selectedAcc}
                            rewardsData={rewardsData}
                            addRequest={addRequest}
                            header={{ step: 1, title: 'Select a token' }}
                            setSelectedToken={setSelectedToken}
                            selectedToken={selectedToken}
                            relayerURL={relayerURL}
                        />
                        <StrategiesList
                            networkId={selectedNetwork.id}
                            tokens={portfolio.tokens}
                            account={selectedAcc}
                            addRequest={addRequest}
                            setSelectedToken={setSelectedToken}
                            selectedToken={selectedToken}
                        />
                        {selectedToken && <DepositCard
                            networkId={selectedNetwork.id}
                            tokens={portfolio.tokens}
                            account={selectedAcc}
                            addRequest={addRequest}
                            setSelectedToken={setSelectedToken}
                            selectedToken={selectedToken}
                        />}
                    </div>
            }
        </div>
    )
}

export default Earn