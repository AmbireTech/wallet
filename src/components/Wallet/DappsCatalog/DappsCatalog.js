import NETWORKS from 'consts/networks'
import { TextInput, ToolTip } from 'components/common'

import './DappsCatalog.scss'
import { useCallback, useState, useEffect } from 'react'
import { MdInfo, MdSearch } from 'react-icons/md'
import { AiOutlineStar, AiFillStar } from 'react-icons/ai'
import useLocalStorage from 'hooks/useLocalStorage'

// we should probably copy the logos, to avoid broken images (in the case the dapp changes or is down)
const CATALOG = [
  {
    name: 'allowance_checker',
    title: 'Allowance checker',
    url: '#/wallet/gnosis/plugins/allowances-checker',
    logo: '/resources/plugins/allowances.png',
    description: 'Check and modify the risk and exposition of your Tokens',
    type: 'integrated',
    networks: []
  },
  {
    name: 'transaction_builder',
    title: 'Transaction Builder',
    url: '#/wallet/gnosis/plugins/txbuilder',
    logo: 'https://safe-apps.dev.gnosisdev.com/tx-builder/tx-builder.png',
    description: 'Build your transaction from scratch (Power users)',
    type: 'integrated',
    networks: []
  },
  {
    name: 'uniswap',
    title: 'Uniswap',
    url: 'https://app.uniswap.org',
    logo: 'https://app.uniswap.org/favicon.png',
    description: 'Uniswap decentralised exchange',
    type: 'walletconnect',
    networks: ['ethereum', 'polygon']
  },
  {
    name: 'sushiswap',
    title: 'Sushiswap',
    url: 'https://app.sushi.com',
    logo: 'https://res.cloudinary.com/sushi-cdn/image/fetch/f_auto,c_limit,w_48,q_auto/https://app.sushi.com/images/logo.svg',
    description: 'Sushiswap decentralised exchange',
    type: 'walletconnect',
    networks: ['ethereum', 'polygon', 'binance-smart-chain', 'fantom', 'gnosis']
  },
  {
    name: 'opensea',
    title: 'Opensea',
    url: '#/wallet/gnosis/plugins/opensea',
    logo: 'https://opensea.io/static/images/logos/opensea.svg',
    description: 'Opensea NFT marketplace',
    type: 'integrated',
    networks: ['ethereum', 'polygon', 'binance-smart-chain', 'fantom', 'gnosis']
  },
  {
    name: 'pancakeswap',
    title: 'PancakeSwap',
    url: 'https://pancakeswap.finance/',
    logo: 'https://avatars.githubusercontent.com/u/71247426?s=200&v=4',
    description: 'PancakeSwap decentralised exchange',
    type: 'walletconnect',
    networks: ['binance-smart-chain']
  },
  {
    name: 'quickswap',
    title: 'Quickswap',
    url: 'https://quickswap.exchange',
    logo: 'https://avatars.githubusercontent.com/u/77100292?s=200&v=4',
    description: 'Quickswap decentralised exchange',
    type: 'walletconnect',
    networks: ['polygon']
  },
  {
    name: 'evm_sigtools',
    title: 'EVM Sigtools',
    url: 'https://ambiretech.github.io/evm-sigtools-public/',
    logo: 'https://ambiretech.github.io/evm-sigtools-public/img/signature-validator-logo-flat.png',
    description: 'Sign, verify and share ethereum messages',
    type: 'walletconnect',
    networks: []
  },
  {
    name: 'aave',
    title: 'Aave',
    url: 'https://app.aave.com/',
    logo: 'https://www.gitbook.com/cdn-cgi/image/width=40,height=40,fit=contain,dpr=1,format=auto/https%3A%2F%2F2799188404-files.gitbook.io%2F~%2Ffiles%2Fv0%2Fb%2Fgitbook-legacy-files%2Fo%2Fspaces%252F-M6U5cfvZsVW8zOEpVl1%252Favatar-1595317514145.png%3Fgeneration%3D1595317514421109%26alt%3Dmedia',
    description: 'Decentralised exchange and lending platform',
    type: 'walletconnect',
    networks: ['ethereum', 'polygon', 'avalanche', 'fantom', 'arbitrum', 'harmony', 'optimism']
  },
]

const CATEGORIES = [
  {
    name: 'all',
    filter: f => f
  },
  {
    name: 'integrated',
    filter: f => f.type === 'integrated'
  },
  {
    name: 'walletconnect',
    filter: f => f.type === 'walletconnect'
  },
  {
    name: 'favorites',
    filter: (f, faves) => Object.keys(faves).indexOf(f.name) !== -1
  }
]

const DappsCatalog = ({ network }) => {

  const [search, setSearch] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState(CATEGORIES[0])
  const [filtered, setFilteredItems] = useState(CATALOG)

  const [favourites, setFavourites] = useLocalStorage({
    key:'dappCatalog-faves',
    defaultValue: {},
  })

  const onSearchChange = useCallback((val) => {
    setSearch(val)
  }, [])

  const sortFiltered = useCallback((filteredItems) => {
    return filteredItems.map(item => {
      return {
        ...item,
        supported: !item.networks.length || !!item.networks.find(supported => supported === network.id)
      }
    }).sort((a, b) => {
      return b.supported - a.supported
    })
  }, [network])


  const getNetworkTooltipContent = useCallback((networks) => {
    return (
      <div className='tooltipNetworks'>
        {
          networks?.map((n) => {
              const network = NETWORKS.find(an => an.id === n)
              if (network) {
                return (
                  <div className='tooltipNetwork'>
                    <span className='tooltipNetwork-icon'
                          style={{ backgroundImage: `url(${network.icon})` }}>
                    </span>
                    <span>
                      {network.name}
                    </span>
                  </div>
                )
              }
              return null
            }
          ).filter(n => n)
        }
      </div>
    )
  }, [])

  const onFavoriteClick = useCallback((e, item) => {
    if (favourites[item.name]) {
      setFavourites(prev => {
        delete prev[item.name]
        return {...prev}
      })
    } else {
      setFavourites(prev => {
        prev[item.name] = true
        return {...prev}
      })
    }
    e.stopPropagation();
  }, [favourites, setFavourites])

  const openDapp = (item) => {
    if (item.type === 'integrated') {
      window.open(item.url, '_self')
    } else {
      window.open(item.url, '_blank')
    }
  }

  // refresh list from filters
  useEffect(() => {
    setFilteredItems(CATALOG.filter(item => {
      let match = true
      if (categoryFilter) {
        match = categoryFilter.filter(item, favourites)
      }
      if (search && match) {
        match = item.title.toLowerCase().includes((search).toLowerCase())
      }
      return match
    }))
  }, [search, categoryFilter, favourites])


  return (
    <section id='dappCatalog'>
      <div className='filterSection'>
        <div className='input-icon'>
          <TextInput value={search} onChange={onSearchChange} placeholder='Search filter' icon={<MdSearch/>}/>
        </div>
        <div className='categories'>
          {CATEGORIES.map(c => {
            return <span
              className={`category category-${c.name}${categoryFilter?.name === c.name ? ' selected' : ''}`}
              onClick={() => setCategoryFilter(c)}>{c.name}</span>
          })}
        </div>
      </div>

      <div className='catalogItems'>
        {
          sortFiltered(filtered).map(item => {
            return <div className={`catalogItem${item.supported ? '' : ' not-supported'}`}
                        onClick={() => openDapp(item)}>
              <span className={`favorite${favourites[item.name] ? ' selected' : ''}`} onClick={(e) => onFavoriteClick(e, item)}> {
                favourites[item.name]
                  ? <AiFillStar />
                  : <AiOutlineStar />
              }</span>
              <div className='logoSplit'>
                <div className='logo'>
                  <img src={item.logo} alt={item.name}/>
                </div>
                <div className='content'>
                  <span className='title'>{item.title}</span>
                  <span className='description'>{item.description}</span>
                </div>
              </div>

              <div className='aligned-tag-rows'>
                {
                  !!item.networks?.length &&
                  <div className='tag-row network-tag-row'>
                    <ToolTip htmlContent={getNetworkTooltipContent(item.networks)} >
                      {
                        !item.supported &&
                        <span className='tag unsupported'>{network.id} unsupported</span>
                      }
                      {
                        item.networks?.slice(0, 3).map((n) => {
                          const network = NETWORKS.find(an => an.id === n)
                          if (network) {
                            return <span className='tag network-tag'
                                         style={{ backgroundImage: `url(${network.icon})` }}></span>
                          }
                          return null
                        })
                      }
                      {
                        item.networks?.length > 3 &&
                        <span className='tag network-tag network-tag-more'>...</span>
                      }
                    </ToolTip>
                  </div>
                }

                <div className='tag-row tag-types'>
                  <span className={`tag type-tag type-tag-${item.type}`}>{item.type}</span>
                </div>
              </div>

            </div>
          })
        }

        {
          // Please someone fixes this in CSS (pixel perfect aligned cols when items not 3 in a row)
          filtered.length % 3 !== 0 &&
          [...Array(3 - filtered.length % 3)].map(a => {
            return <div className='catalogItem-filler'></div>
          })
        }
      </div>

      {
        !filtered.length &&
        <div className='no-dapp-found'>No dApp found in our list matching your criteria</div>
      }

      <div className='info-wc'>
        <MdInfo/> Note: any dApp that supports walletconnect can be connected as well
      </div>
    </section>
  )
}

export default DappsCatalog
