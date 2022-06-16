import NETWORKS from 'consts/networks'
import { TextInput } from 'components/common'

import './DappsCatalog.scss'
import { useCallback, useState } from 'react'
import { MdInfo, MdSearch } from 'react-icons/md'

// we should probably copy the logos, to avoid broken images (in the case the dapp changes or is down)
const CATALOG = [
  {
    title: 'Allowance checker',
    url: '#/wallet/gnosis/plugins/allowances-checker',
    logo: '/resources/plugins/allowances.png',
    description: 'Check and modify the risk and exposition of your Tokens',
    type: 'integrated',
    networks: []
  },
  {
    title: 'Transaction Builder',
    url: '#/wallet/gnosis/plugins/txbuilder',
    logo: 'https://safe-apps.dev.gnosisdev.com/tx-builder/tx-builder.png',
    description: 'Build your transaction from scratch (Power users)',
    type: 'integrated',
    networks: []
  },
  {
    title: 'Uniswap',
    url: 'https://app.uniswap.org',
    logo: 'https://app.uniswap.org/favicon.png',
    description: 'Uniswap decentralised exchange',
    type: 'walletconnect',
    networks: ['ethereum', 'polygon']
  },
  {
    title: 'Sushiswap',
    url: 'https://app.sushi.com',
    logo: 'https://res.cloudinary.com/sushi-cdn/image/fetch/f_auto,c_limit,w_48,q_auto/https://app.sushi.com/images/logo.svg',
    description: 'Sushiswap decentralised exchange',
    type: 'walletconnect',
    networks: ['ethereum', 'polygon', 'binance-smart-chain', 'fantom', 'gnosis']
  },
  {
    title: 'Opensea',
    url: '#/wallet/gnosis/plugins/opensea',
    logo: 'https://opensea.io/static/images/logos/opensea.svg',
    description: 'Opensea NFT marketplace',
    type: 'integrated',
    networks: ['ethereum', 'polygon', 'binance-smart-chain', 'fantom', 'gnosis']
  },
  {
    title: 'PancakeSwap',
    url: 'https://pancakeswap.finance/',
    logo: 'https://avatars.githubusercontent.com/u/71247426?s=200&v=4',
    description: 'PancakeSwap decentralised exchange',
    type: 'walletconnect',
    networks: ['binance-smart-chain']
  },
  {
    title: 'Quickswap',
    url: 'https://quickswap.exchange',
    logo: 'https://avatars.githubusercontent.com/u/77100292?s=200&v=4',
    description: 'Quickswap decentralised exchange',
    type: 'walletconnect',
    networks: ['polygon']
  },
  {
    title: 'EVM Sigtools',
    url: 'https://ambiretech.github.io/evm-sigtools-public/',
    logo: 'https://ambiretech.github.io/evm-sigtools-public/img/signature-validator-logo-flat.png',
    description: 'Sign, verify and share ethereum messages',
    type: 'walletconnect',
    networks: []
  },

  {
    title: 'Aave',
    url: 'https://app.aave.com/',
    logo: 'https://www.gitbook.com/cdn-cgi/image/width=40,height=40,fit=contain,dpr=1,format=auto/https%3A%2F%2F2799188404-files.gitbook.io%2F~%2Ffiles%2Fv0%2Fb%2Fgitbook-legacy-files%2Fo%2Fspaces%252F-M6U5cfvZsVW8zOEpVl1%252Favatar-1595317514145.png%3Fgeneration%3D1595317514421109%26alt%3Dmedia',
    description: 'Decentralised exchange and lending platform',
    type: 'walletconnect',
    networks: ['ethereum', 'polygon', 'avalanche', 'fantom', 'arbitrum', 'harmony', 'optimism']
  },
]

const DappsCatalog = ({ network }) => {

  const [search, setSearch] = useState(null)
  const [filtered, setFilteredItems] = useState(CATALOG)

  const onSearchChange = useCallback((val) => {
    setSearch(val)
    setFilteredItems(CATALOG.filter(item => {
      return item.title.toLowerCase().includes(val.toLowerCase())
    }))
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

  const openDapp = (item) => {
    if (item.type === 'integrated') {
      window.open(item.url, '_self')
    } else {
      window.open(item.url, '_blank')
    }
  }

  return (
    <section id='dappCatalog'>
      <div className='filterSection'>
        <div className='input-icon'>
          <TextInput value={search} onChange={onSearchChange} placeholder='Search filter' icon={<MdSearch/>}/>
        </div>
      </div>

      <div className='catalogItems'>
        {
          sortFiltered(filtered).map(item => {

            return <div className={`catalogItem${item.supported ? '' : ' not-supported'}`}
                        onClick={() => openDapp(item)}>
              <div className='logoSplit'>
                <div className='logo'>
                  <img src={item.logo} alt={item.name}/>
                </div>
                <div className='content'>
                  <span className='title'>{item.title}</span>
                  <span className='description'>{item.description}</span>
                </div>
              </div>

              <div className='tag-row'>
                <span className={`tag type-tag type-tag-${item.type}`}>{item.type}</span>
              </div>

              {
                !!item.networks?.length &&
                <div className='tag-row network-tag-row'>
                  {
                    !item.supported &&
                    <span className='tag unsupported'>{network.id} unsupported</span>
                  }
                  {
                    item.networks?.map((n) => {
                      const network = NETWORKS.find(an => an.id === n)
                      if (network) {
                        return <span className='tag network-tag'
                                     style={{ backgroundImage: `url(${network.icon})` }}></span>
                      }
                      return null
                    })
                  }
                </div>
              }
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
