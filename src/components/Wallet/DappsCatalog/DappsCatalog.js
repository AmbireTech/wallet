import NETWORKS from 'consts/networks'
import { TextInput, ToolTip } from 'components/common'
import GnosisSafeAppIframe from 'components/Plugins/GnosisSafeApps/GnosisSafeAppIframe'
import './DappsCatalog.scss'
import { useCallback, Fragment, useEffect, useState } from 'react'
import { MdInfo, MdSearch, MdDelete, MdBuildCircle } from 'react-icons/md'
import { AiOutlineStar, AiFillStar } from 'react-icons/ai'
import { Button } from 'components/common'
import DAPPS_ICON from 'resources/dapps.svg'
import AMBIRE_ICON_HOT from 'resources/icon.png'
import { AddCustomDappModal } from 'components/Modals'
import { useModals } from 'hooks'
import { fetch } from 'lib/fetch'
import { canOpenInIframe, getManifestFromDappUrl } from 'ambire-common/src/services/dappCatalog'
import { useOneTimeQueryParam } from 'hooks/oneTimeQueryParam'
import { useHistory } from 'react-router-dom'

const CONNECTION_TYPE_LABEL = {
  'walletconnect': 'WalletConnect'
}

const CATEGORY_LABEL = {
  'walletconnect': 'WalletConnect'
}

const DappsCatalog = ({ network, dappsCatalog, selectedAcc, gnosisConnect, gnosisDisconnect }) => {
  const dappUrl = useOneTimeQueryParam('dappUrl')
  const { addCustomDapp, loadDappFromUrl, isDappMode, currentDappData, toggleFavorite, favorites, filteredCatalog, onCategorySelect, categoryFilter, search, onSearchChange, categories, loadCurrentDappData, removeCustomDapp } = dappsCatalog
  const { showModal } = useModals()
  const [dappUrlFromLink, setDappUrlsFromLink] = useState('')
  const history = useHistory()

  useEffect(() => {
    setDappUrlsFromLink(dappUrl)
  }, [dappUrl])

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
                <div key={network.id} className='tooltipNetwork'>
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
    toggleFavorite(item)
    e.stopPropagation()
  }, [toggleFavorite])

  const openDapp = useCallback(async (item) => {
    if ((item.connectionType === 'gnosis' && (!item.custom)) || item.forceInternal || await canOpenInIframe(fetch, item.url)) {
      loadCurrentDappData(item)
    } else {
      window.open(item.url, '_blank')
    }
  }, [loadCurrentDappData])

  const onRemoveCustomClick = useCallback((e, item) => {
    e.stopPropagation()
    e.preventDefault()
    removeCustomDapp(item)
  }, [removeCustomDapp])

  const openCustomDappModal = useCallback((_ev, dappUrl) => {
    showModal(<AddCustomDappModal dappsCatalog={dappsCatalog} dappUrl={dappUrl} />)
  }, [dappsCatalog, showModal])

  useEffect(() => {
    if (!dappUrlFromLink) return

    if (!selectedAcc) {
      // TODO: Handle global query param
      history.push(`/add-account?dappUrl=${dappUrlFromLink}`)
    }

    const loaded = loadDappFromUrl(dappUrlFromLink)
    setDappUrlsFromLink('')

    if (loaded) {
      return
    } else {
      async function tryAutoLoad() {
        const manifest = await getManifestFromDappUrl(fetch, dappUrlFromLink)
        if (manifest && manifest.isWalletPlugin) {
          addCustomDapp(manifest)
        } else {
          openCustomDappModal(null, dappUrlFromLink)
        }
      }

      tryAutoLoad()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dappUrlFromLink, loadDappFromUrl, selectedAcc])

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
                  key={c.name}
                  className={`category category-${c.name}${categoryFilter?.name === c.name ? ' selected' : ''}`}
                  onClick={() => onCategorySelect(c)}>{CATEGORY_LABEL[c.name] || c.name}</span>
              })}
            </div>
          </div>

          <div className='catalogItems'>
            <div className={`catalogItem add-custom-dapp`} >
              <div className='tools'>
                <ToolTip label={`Click here to see how create dApp for Ambire Wallet catalog`}>
                  <a className="info-btn" href={'https://github.com/AmbireTech/wallet-dapp-catalog#readme'}
                    target="_blank"
                    rel="noreferrer noopener">
                    <MdBuildCircle size={23} />
                  </a>
                </ToolTip>
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
                  onClick={() => item.supported && openDapp(item)}
                  key={item.id}
                >

                  <div className='tools'>
                    {item.featured &&
                      <ToolTip label={`Hot dApp`}>
                        <img className='icon hot-dapp' src={AMBIRE_ICON_HOT} alt='hot dApp icon' />
                      </ToolTip>
                    }
                    {item.custom &&
                      <ToolTip label={`Remove ${item.name} from your catalog`}>
                        <MdDelete className='icon remove-dapp' onClick={(e) => onRemoveCustomClick(e, item)} />
                      </ToolTip>
                    }
                    {item.custom &&
                      <img className='custom-dapp icon' src={DAPPS_ICON} alt='custom dapp icon' />
                    }
                    <ToolTip label={`${favorites[item.url] ? 'Remove' : 'Add'} ${item.name} ${favorites[item.url] ? 'from' : 'to'} favorites`}>
                      <span className={`favorite${favorites[item.url] ? ' selected' : ''}`} onClick={(e) => onFavoriteClick(e, item)}> {
                        favorites[item.url]
                          ? <AiFillStar className='icon' /> :
                          <AiOutlineStar className='icon' />

                      }</span>
                    </ToolTip>
                  </div>

                  <div className='base-info'>
                    <div className='logoSplit'>
                      <div className='logo'>
                        <img src={item.iconUrl || DAPPS_ICON} alt={item.name} />
                      </div>
                      <div className='content'>
                        <span className='title'>{item.name}</span>
                      </div>
                    </div>
                    <div className='description'>{item.description}</div>
                  </div>

                  <div>

                    {!item.supported &&
                      <div className='tag-row unsupported'>
                        <span className='tag unsupported'>{network.id} unsupported</span>
                      </div>
                    }

                    <div className='aligned-tag-rows'>
                      {
                        !!item.networks?.length &&
                        <ToolTip htmlContent={getNetworkTooltipContent(item.networks)} >
                          <div className='tag-row network-tag-row'>
                            {/* NOTE: remove reverse if there is way to match the design without flex-direction: row-reverse; */}
                            {
                              item.networks?.length > 3 &&
                              <span className='tag network-tag network-tag-more'>...</span>
                            }
                            {
                              item.networks?.slice(0, 3).reverse().map((n) => {
                                const network = NETWORKS.find(an => an.id === n)
                                if (network) {
                                  return <span key={network.id} className='tag network-tag'
                                    style={{ backgroundImage: `url(${network.icon})` }}></span>
                                }
                                return null
                              })
                            }
                          </div>
                        </ToolTip>
                      }

                      <div className='tag-row tag-types'>
                        <span className={`tag type-tag type-tag-${item.category}`}>{CONNECTION_TYPE_LABEL[item.category] || item.category}</span>
                      </div>
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
            <MdInfo /> Note: any dApp that supports WalletConnect can be connected as well
          </div>
        </Fragment>
      }
    </section>
  )
}

export default DappsCatalog
