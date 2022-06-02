import './Earn.scss'

import {useMemo, useState} from 'react'
import { Loading } from 'components/common'
import TokensList from './Cards/TokensList/TokensList'
import StrategiesList from './Cards/StrategiesList/StrategiesList'
import DepositCard from './Cards/DepositCard/DepositCard'

const Earn = ({ portfolio, privateMode, selectedNetwork, rewardsData, selectedAcc, addRequest, relayerURL }) => {
    const [selectedToken, setSelectedToken] = useState(null)
    const [strategies, setStrategies] = useState(null)

    const availableStrategies = useMemo(() => {
        if (!strategies || !selectedToken) return null

        if (selectedToken.isStaked) {
            return [{
                name: selectedToken.strategyName,
                token: selectedToken
            }]
        }

        const _strategies = []

        Object.keys(strategies).forEach(strategy => {
            const token = strategies[strategy].find(token => token.baseTokenAddress.toLowerCase() === selectedToken.baseTokenAddress.toLowerCase())

            if (!token) return

            _strategies.push({
                name: strategy,
                token
            })
        })

        return _strategies
    }, [selectedToken, strategies])

    console.log(availableStrategies)

    return (
        <div id="earn">
            {
                portfolio.isCurrNetworkBalanceLoading ?
                    <Loading/>
                    :
                    <div className="cards">
                       <TokensList
                            networkId={selectedNetwork.id}
                            portfolioTokens={portfolio.tokens}
                            accountId={selectedAcc}
                            rewardsData={rewardsData}
                            addRequest={addRequest}
                            header={{ step: 1, title: 'Select a token' }}
                            setSelectedToken={setSelectedToken}
                            setStrategies={setStrategies}
                            selectedToken={selectedToken}
                            relayerURL={relayerURL}
                            privateMode={privateMode}
                        />
                        <StrategiesList
                            networkId={selectedNetwork.id}
                            tokens={portfolio.tokens}
                            account={selectedAcc}
                            addRequest={addRequest}
                            setSelectedToken={setSelectedToken}
                            selectedToken={selectedToken}
                        />
                        {!selectedToken?.isStaked && <DepositCard
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