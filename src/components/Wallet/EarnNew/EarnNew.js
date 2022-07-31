import './Earn.scss'

import { useMemo, useState } from 'react'
import { Loading } from 'components/common'
import TokensList from './Cards/TokensList/TokensList'

import WithdrawCard from './Cards/WithdrawCard/WithdrawCard'
import StrategiesList from './Cards/StrategiesList/StrategiesList'
import DepositCard from './Cards/DepositCard/DepositCard'

const Earn = ({ portfolio, privateMode, selectedNetwork, rewardsData, selectedAcc, addRequest, relayerURL }) => {
  const [selectedToken, setSelectedToken] = useState(null)
  const [selectedStrategy, setSelectedStrategy] = useState(null)
  const [strategies, setStrategies] = useState(null)
  const [selectedTokenType, setSelectedTokenType] = useState(null)

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

  return (
    <div id='earn'>
      {
        portfolio.isCurrNetworkBalanceLoading ?
          <Loading/>
          :
          <div className='section'>
            <div className='cards'>
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
                setSelectedStrategy={setSelectedStrategy}
                setSelectedTokenType={setSelectedTokenType}
                relayerURL={relayerURL}
                privateMode={privateMode}
              />

              {
                selectedToken &&
                <StrategiesList
                  networkId={selectedNetwork.id}
                  selectedToken={selectedToken}
                  availableStrategies={availableStrategies}
                  account={selectedAcc}
                  selectedTokenType={selectedTokenType}
                  selectedStrategy={selectedStrategy}
                  setSelectedStrategy={setSelectedStrategy}
                />
              }

              {
                (selectedTokenType === 'unstaked') &&
                <DepositCard
                  inactive={selectedToken && !selectedStrategy}
                  selectedNetwork={selectedNetwork}
                  selectedToken={selectedToken}
                  availableStrategies={availableStrategies}
                  selectedAccount={selectedAcc}
                  selectedStrategy={selectedStrategy}
                  strategies={strategies}
                  portfolio={portfolio}
                  addRequest={addRequest}
                  relayerURL={relayerURL}
                />
              }

              {
                (selectedTokenType === 'staked') &&
                <WithdrawCard
                  inactive={selectedToken && !selectedStrategy}
                  selectedNetwork={selectedNetwork}
                  selectedToken={selectedToken}
                  availableStrategies={availableStrategies}
                  selectedAccount={selectedAcc}
                  selectedStrategy={selectedStrategy}
                  strategies={strategies}
                  portfolio={portfolio}
                  addRequest={addRequest}
                />
              }

              {
                !selectedToken &&
                <div className='panel instructions-panel'>
                  <div className='strategies-list--empty'>
                    <div className='strategies-how-to'>
                      <div>
                        <h4>WHAT IS STAKED TOKEN?</h4>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec arcu diam, facilisis ultricies
                          gravida quis, semper nec sapien. Ut eget dolor dignissim, maximus tellus non, ornare dui. Nunc
                          convallis neque nec libero venenatis facilisis vehicula lobortis turpis. Integer interdum sed
                          augue a aliquet. Donec tincidunt turpis quis lacus dignissim tincidunt. Integer at nulla
                          magna. Praesent bibendum maximus sapien, non posuere diam. Donec consectetur tristique
                          finibus.</p>
                      </div>
                      <div>
                        <h4>WHAT IS STAKED TOKEN?</h4>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec arcu diam, facilisis ultricies
                          gravida quis, semper nec sapien. Ut eget dolor dignissim, maximus tellus non, ornare dui. Nunc
                          convallis neque nec libero venenatis facilisis vehicula lobortis turpis. Integer interdum sed
                          augue a aliquet. Donec tincidunt turpis quis lacus dignissim tincidunt. Integer at nulla
                          magna. Praesent bibendum maximus sapien, non posuere diam. Donec consectetur tristique
                          finibus.</p>
                      </div>
                    </div>

                    <div className='deposit-how-to'>
                      <h2 className='centered'>Deposit</h2>

                      <section className='step-indicator'>
                        <div className='step step1 active'>
                          <div className='step-header'>
                            <div className='step-icon'>1</div>
                            <div className='indicator-line active'></div>
                          </div>
                          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec arcu diam, facilisis
                            ultricies gravida quis, semper nec sapien. Ut eget dolor dignissim, maximus tellus non,
                            ornare dui. Nunc convallis neque nec libero venenatis facilisis vehicula lobortis.</p>
                        </div>
                        <div className='step step2'>
                          <div className='step-header'>
                            <div className='step-icon'>2</div>
                            <div className='indicator-line'></div>
                          </div>
                          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec arcu diam, facilisis
                            ultricies gravida quis, semper nec sapien. Ut eget dolor dignissim, maximus tellus non,
                            ornare dui. Nunc convallis neque nec libero venenatis facilisis vehicula lobortis.</p>
                        </div>
                        <div className='step step3'>
                          <div className='step-icon'>3</div>
                          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec arcu diam, facilisis
                            ultricies gravida quis, semper nec sapien. Ut eget dolor dignissim, maximus tellus non,
                            ornare dui. Nunc convallis neque nec libero venenatis facilisis vehicula lobortis.</p>
                        </div>
                      </section>
                    </div>

                    <div className='withdraw-how-to'>
                      <h2 className='centered'>Withdraw</h2>
                      <section className='step-indicator step-indicator-small'>
                        <div className='step step1 active'>
                          <div className='step-header'>
                            <div className='step-icon' />
                            <div className='indicator-line active'></div>
                          </div>
                          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec arcu diam, facilisis
                            ultricies gravida quis, semper nec sapien. Ut eget dolor dignissim, maximus tellus non,
                            ornare dui. Nunc convallis neque nec libero venenatis facilisis vehicula lobortis.</p>
                        </div>
                        <div className='step step2'>
                          <div className='step-header'>
                            <div className='step-icon' />
                            <div className='indicator-line'></div>
                          </div>
                          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec arcu diam, facilisis
                            ultricies gravida quis, semper nec sapien. Ut eget dolor dignissim, maximus tellus non,
                            ornare dui. Nunc convallis neque nec libero venenatis facilisis vehicula lobortis.</p>
                        </div>
                        <div className='step step3'>
                          <div className='step-header'>
                            <div className='step-icon' />
                          </div>
                          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec arcu diam, facilisis
                            ultricies gravida quis, semper nec sapien. Ut eget dolor dignissim, maximus tellus non,
                            ornare dui. Nunc convallis neque nec libero venenatis facilisis vehicula lobortis.</p>
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
      }
    </div>
  )
}

export default Earn
