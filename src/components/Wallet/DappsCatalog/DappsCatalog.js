import NETWORKS from 'consts/networks'
import { TextInput, ToolTip } from 'components/common'

import './DappsCatalog.scss'
import { useCallback } from 'react'
import { MdInfo, MdSearch } from 'react-icons/md'
import { AiOutlineStar, AiFillStar } from 'react-icons/ai'


const DappsCatalog = ({ network, dappsCatalog }) => {

  console.log({dappsCatalog})

  const { toggleFavorite, favorites, filteredCatalog, onCategorySelect, categoryFilter, search, onSearchChange, categories } = dappsCatalog

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
    toggleFavorite(item)
    e.stopPropagation();
  }, [toggleFavorite])

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
          <TextInput value={search} onChange={onSearchChange} placeholder='Search filter' icon={<MdSearch />} />
        </div>
        <div categories='categories'>
          {categories.map(c => {
            return <span
              className={`category category-${c.name}${categoryFilter?.name === c.name ? ' selected' : ''}`}
              onClick={() => onCategorySelect(c)}>{c.name}</span>
          })}
        </div>
      </div>

      <div className='catalogItems'>
        {
          sortFiltered(filteredCatalog).map(item => {
            return <div className={`catalogItem${item.supported ? '' : ' not-supported'}`}
              onClick={() => openDapp(item)}>
              <span className={`favorite${favorites[item.name] ? ' selected' : ''}`} onClick={(e) => onFavoriteClick(e, item)}> {
                favorites[item.name]
                  ? <AiFillStar />
                  : <AiOutlineStar />
              }</span>
              <div className='logoSplit'>
                <div className='logo'>
                  <img src={item.logo} alt={item.name} />
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
          filteredCatalog.length % 3 !== 0 &&
          [...Array(3 - filteredCatalog.length % 3)].map(a => {
            return <div className='catalogItem-filler'></div>
          })
        }
      </div>

      {
        !filteredCatalog.length &&
        <div className='no-dapp-found'>No dApp found in our list matching your criteria</div>
      }

      <div className='info-wc'>
        <MdInfo /> Note: any dApp that supports walletconnect can be connected as well
      </div>
    </section>
  )
}

export default DappsCatalog
