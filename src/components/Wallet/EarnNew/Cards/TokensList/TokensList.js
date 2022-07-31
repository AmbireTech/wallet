import './TokensList.scss'
import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import Card from 'components/Wallet/EarnNew/Card/Card'

import { TextInput } from 'components/common'
import { getTokenIcon } from 'lib/icons'
import { GiToken } from 'react-icons/gi'
import { MdOutlineClose } from 'react-icons/md'
import { formatFloatTokenAmount } from 'lib/formatters'

const TokensList = ({ networkId, setStrategies, header, setSelectedToken, selectedToken, relayerURL, portfolioTokens, privateMode, setSelectedStrategy, setSelectedTokenType }) => {
  const [failedImg, setFailedImg] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [, setCustomInfo] = useState(null)
  const [tokens, setTokens] = useState([])
  const hiddenTextInput = useRef()

  const handleSearch = useCallback((v) => {
    setSelectedStrategy(null)
    setSelectedTokenType(null)
    setSelectedToken(null)
    setCustomInfo(null)
    setSearch(v)
  }, [setSelectedStrategy, setSelectedTokenType, setSelectedToken])

  const onTokenSelect = useCallback((token, type) => {
    setSelectedStrategy(null)
    setCustomInfo(null)
    handleSearch('')
    setSelectedToken(token)
    setSelectedTokenType(type)
  }, [setSelectedStrategy, setSelectedToken, setSelectedTokenType, handleSearch])

  const availableTokens = useMemo(() => {
    const uniqueTokens = {}

    // Get unique tokens having highest APY
    tokens.forEach(token => {
      const baseAddr = token.baseTokenAddress.toLowerCase()
      if (!uniqueTokens[baseAddr] || uniqueTokens[baseAddr].apy < token.apy) {
        uniqueTokens[baseAddr] = token
      }
    })

    return Object.values(uniqueTokens)
      .filter(t => parseFloat(t.apy))
      .filter(t => t.baseTokenSymbol.toLowerCase().indexOf(search.toLowerCase()) !== -1 || t.baseTokenAddress.toLowerCase() === search.toLowerCase())
      .sort((a, b) => b.apy - a.apy)
  }, [tokens, search])


  const stakedTokens = useMemo(() => {
    return tokens
      .filter(t => t.portfolioToken)
      .map(t => ({
        ...t,
        isStaked: true,
      }))
      .filter(t => t.symbol.toLowerCase().indexOf(search.toLowerCase()) !== -1 || t.address.toLowerCase() === search.toLowerCase())
      .sort((a, b) => b.apy - a.apy)
  }, [tokens, search])

  const extractTokens = useCallback(strategies => {
    const tokens = []

    Object.keys(strategies).forEach(strategy => {
      strategies[strategy].forEach(token => {
        const portfolioToken = portfolioTokens.find(pt => pt.address.toLowerCase() === token.address.toLowerCase())
        const portfoliobaseToken = portfolioTokens.find(pt => pt.address.toLowerCase() === token.baseTokenAddress.toLowerCase())

        tokens.push({
          ...token,
          strategyName: strategy,
          icon: getTokenIcon(networkId, token.baseTokenAddress),
          ...portfolioToken && {
            portfolioToken: {
              balance: portfolioToken.balance,
              decimals: portfolioToken.decimals
            }
          },
          ...portfoliobaseToken && {
            portfolioBaseToken: {
              balance: portfoliobaseToken.balance,
              decimals: portfoliobaseToken.decimals
            }
          }
        })
      })
    })

    return tokens
  }, [networkId, portfolioTokens])

  useEffect(() => {
    const fetchStrategies = async () => {
      const { data: strategies } = await (await fetch(`${relayerURL}/earn/strategies/${networkId}`)).json()

      setStrategies(strategies)
      setTokens(extractTokens(strategies))
      setLoading(false)
    }

    fetchStrategies()
  }, [relayerURL, networkId, setStrategies, extractTokens])

  const getIcon = ({ icon, fallbackIcon, label }) => {
    if (!icon) return null
    const url = failedImg.includes(icon) && fallbackIcon ? fallbackIcon : icon
    return (
      failedImg.includes(url)
        ?
        <div className='icon'>
          <GiToken size={16}/>
        </div>
        : <img
          className='icon'
          src={url}
          draggable='false'
          alt={label}
          onError={() => setFailedImg(failed => [...failed, url])}
        />
    )
  }
  return (
    <Card
      loading={loading}
      header={header}
      className='card-tokens'
    >
      <div className='tokens-list-wrapper'>
        <TextInput
          className='select-search-input'
          placeholder='Search name or paste an address'
          value={search}
          ref={hiddenTextInput}
          buttonLabel={search.length ? <MdOutlineClose/> : null}
          onInput={value => handleSearch(value)}
          onButtonClick={() => handleSearch('')}
        />
        <p className='section-title'>Available assets to stake</p>
        {
          availableTokens.length ? (
            <>
              <div className='tokens-list'>
                {availableTokens.map(t => (
                  <div
                    className={`token-item ${!selectedToken?.isStaked && (selectedToken?.baseTokenAddress === t.baseTokenAddress) ? 'active' : ''}`}
                    onClick={() => onTokenSelect(t, 'unstaked')}>
                    <div className='header'>
                      {getIcon(t)}
                      <p className='symbol'>{t.baseTokenSymbol}</p>
                    </div>
                    <div>
                      MAX APY: {t.apy}%
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            search !== ''
              ? <div className='notification-clear'>No tokens matching your search</div>
              : <div className='notification-clear'>No tokens found to stake</div>
          )
        }
        <p className='section-title'>Available tokens to unstake</p>
        {
          stakedTokens.length ? (
            <>
              <div className='tokens-list'>
                {stakedTokens.map(t => (
                  <div
                    className={`token-item ${selectedToken?.isStaked && (selectedToken?.address === t.address) ? 'active' : ''}`}
                    onClick={() => onTokenSelect(t, 'staked')}>
                    <div className='header'>
                      {getIcon(t)}
                      <p className='symbol'>{t.symbol}</p>
                    </div>
                    <div>
                      {privateMode.hidePrivateValue(formatFloatTokenAmount(t.portfolioToken.balance, true, t.portfolioToken.decimals))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            search !== ''
              ? <div className='notification-clear'>No tokens matching your search</div>
              : <div className='notification-clear'>No tokens found to unstake</div>
          )
        }
      </div>
    </Card>
  )
}

export default TokensList
