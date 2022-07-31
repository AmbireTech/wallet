import './StrategiesList.scss'
import { useEffect, useRef, useState } from 'react'
import Card from 'components/Wallet/EarnNew/Card/Card'

const StrategiesList = ({ networkId, selectedToken, availableStrategies, selectedStrategy, setSelectedStrategy, selectedTokenType }) => {
  const currentNetwork = useRef()
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    currentNetwork.current = networkId
    setLoading(true)
  }, [networkId])

  useEffect(() => setLoading(false), [])

  return (
    <Card
      loading={isLoading}
      large={!!!selectedToken}
      header={{ step: 2, title: selectedTokenType === 'unstaked' ? 'Select a staking strategy' : 'Protocol to unstake from' }}
    >
      <div className='availableStrategies'>
        {
          availableStrategies
            .sort((a, b) => b.token.apy - a.token.apy)
            .map(s => {
              return (
                <div>
                  <div
                    onClick={() => setSelectedStrategy(s.name)}
                    className={`availableStrategy strategy-${s.name.toLowerCase()} ${selectedStrategy === s.name ? 'selected' : ''}`}>
                    <div className='strategy-logo'>
                      <img src={`/resources/strategies/${s.name.toLowerCase()}.svg`} alt={s.name}/>
                      <span className='ribbon'>APY: {s.token.apy}%</span>
                    </div>
                    {
                      selectedStrategy === s.name &&
                      <div className='strategy-description'>
                        {s.token.description}
                      </div>
                    }
                  </div>
                </div>
              )
            })
        }
      </div>
    </Card>
  )
}

export default StrategiesList
