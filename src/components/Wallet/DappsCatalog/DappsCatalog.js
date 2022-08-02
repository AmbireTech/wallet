import NETWORKS from 'consts/networks'
import { TextInput, ToolTip } from 'components/common'
import GnosisSafeAppIframe from 'components/Plugins/GnosisSafeApps/GnosisSafeAppIframe'
import './DappsCatalog.scss'
import { useCallback, Fragment } from 'react'
import { MdInfo, MdSearch, MdDelete } from 'react-icons/md'
import { AiOutlineStar, AiFillStar } from 'react-icons/ai'
import { Button } from 'components/common'
import DAPPS_ICON from 'resources/dapps.svg'
import { AddCustomDappModal } from 'components/Modals'
import { useModals } from 'hooks'


const DappsCatalog = ({ network, dappsCatalog, selectedAcc, gnosisConnect, gnosisDisconnect }) => {

  const { isDappMode, currentDappData, toggleFavorite, favorites, filteredCatalog, onCategorySelect, categoryFilter, search, onSearchChange, categories, loadCurrentDappData, removeCustomDapp } = dappsCatalog
  const { showModal } = useModals()

  const sortFiltered = useCallback((filteredItems) => {
    return filteredItems.map(item => {
      return {
        ...item,
        supported: !item.networks?.length || !!item.networks?.find(supported => supported === network.id)
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
                    style={{ backgroundImage: `url(${network.iconUrl})` }}>
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
    console.log({ item })
    toggleFavorite(item)
    e.stopPropagation()
  }, [toggleFavorite])

  const openDapp = (item) => {
    if (item.connectionType === 'gnosis') {
      loadCurrentDappData(item)
    } else {
      window.open(item.url, '_blank')
    }
  }

  const onRemoveCustomClick = useCallback((e, item) => {
    console.log({ item })
    e.stopPropagation()
    e.preventDefault()
    removeCustomDapp(item)
  }, [removeCustomDapp])

  const openCustomDappModal = useCallback(() => showModal(<AddCustomDappModal dappsCatalog={dappsCatalog} />), [dappsCatalog, showModal])

  return (
    <section id='dappCatalog'>
      {isDappMode && currentDappData ?
        <GnosisSafeAppIframe
          className='dapp-iframe'
          network={network}
          selectedApp={currentDappData}
          selectedAcc={selectedAcc}
          // removeApp={removeCustomPlugin}
          gnosisConnect={gnosisConnect}
          gnosisDisconnect={gnosisDisconnect}
        />
        :
        <Fragment>
          <div className='filter-section'>
            <div className='input-icon'>
              <TextInput value={search} onChange={onSearchChange} placeholder='Search filter' icon={<MdSearch />} />
            </div>
            <div className='categories'>
              {categories.map(c => {
                return <span
                  className={`category category-${c.name}${categoryFilter?.name === c.name ? ' selected' : ''}`}
                  onClick={() => onCategorySelect(c)}>{c.name}</span>
              })}
            </div>
          </div>

          <div className='catalogItems'>
            <div className={`catalogItem add-custom-dapp`} >
              <div className='tools'>
                <img className='custom-dapp' src={DAPPS_ICON} alt='add custom dapps' />
              </div>
              <div className='custom-dapp-icon-wrapper'>
                <img className='custom-dapp-icon' src={DAPPS_ICON} alt='add custom dapps icon' />
              </div>
              <Button border mini onClick={openCustomDappModal}>Add custom dApp</Button>
            </div>
            {
              sortFiltered(filteredCatalog).map(item => {
                return <div className={`catalogItem${item.supported ? '' : ' not-supported'}`}
                  onClick={() => openDapp(item)}>

                  <div className='tools'>
                    {item.custom &&
                      <div onClick={(e) => onRemoveCustomClick(e, item)}>
                        <MdDelete />
                      </div>}
                    {item.custom &&
                      <img className='custom-dapp item' src={DAPPS_ICON} alt='custom dapp icon' />}
                    <span className={`favorite${favorites[item.url] ? ' selected' : ''}`} onClick={(e) => onFavoriteClick(e, item)}> {
                      favorites[item.url]
                        ? <AiFillStar height={20} />
                        : <AiOutlineStar height={20} />
                    }</span>
                  </div>

                  <div className='base-info'>
                    <div className='logoSplit'>
                      <div className='logo'>
                        <img src={item.iconUrl} alt={item.name} />
                      </div>
                      <div className='content'>
                        <span className='title'>{item.name}</span>
                      </div>
                    </div>
                    <div className='description'>{item.description}</div>
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
                      <span className={`tag type-tag type-tag-${item.category}`}>{item.category}</span>
                    </div>
                  </div>

                </div>
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
        </Fragment>
      }
    </section>
  )
}

export default DappsCatalog
