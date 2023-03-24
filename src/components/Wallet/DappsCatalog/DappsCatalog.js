import cn from 'classnames'
import NETWORKS from 'consts/networks'
import { TextInput, ToolTip } from 'components/common'
import GnosisSafeAppIframe from 'components/Plugins/GnosisSafeApps/GnosisSafeAppIframe'
import { useCallback, useEffect, useState } from 'react'
import { MdInfo, MdDelete } from 'react-icons/md'
import { AiOutlineStar, AiFillStar } from 'react-icons/ai'
import { Button } from 'components/common'
import DAPPS_ICON from 'resources/dapps.svg'
import AMBIRE_ICON_HOT from 'resources/icon.png'
import AddCustomDappModal from 'components/Modals/AddCustomDappModal/AddCustomDappModal'
import { useModals } from 'hooks'
import { fetch } from 'lib/fetch'
import { canOpenInIframe, getManifestFromDappUrl } from 'ambire-common/src/services/dappCatalog'
import { useOneTimeQueryParam } from 'hooks/oneTimeQueryParam'
import { useHistory } from 'react-router-dom'

import { ReactComponent as SearchIcon } from 'resources/icons/search.svg'

import styles from './DappsCatalog.module.scss'

const CONNECTION_TYPE_LABEL = {
  'walletconnect': 'WalletConnect'
}

const CATEGORY_LABEL = {
  'walletconnect': 'WalletConnect'
}

const DappsCatalog = ({ network, dappsCatalog, selectedAcc, gnosisConnect, gnosisDisconnect }) => {
  const dappUrl = useOneTimeQueryParam('dappUrlCatalog')
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
      <div className={styles.tooltipNetworks}>
        {
          networks?.map((n) => {
            const network = NETWORKS.find(an => an.id === n)
            if (network) {
              return (
                <div key={network.id} className={styles.tooltipNetwork}>
                  <span className={styles.tooltipNetworkIcon}
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
    gnosisDisconnect() // disconnect the previous dapp
    loadCurrentDappData(null) // reset current dapp data
    if ((item.connectionType === 'gnosis' && (!item.custom)) || item.forceInternal || await canOpenInIframe(fetch, item.url)) {
      loadCurrentDappData(item)
    } else {
      window.open(item.url, '_blank')
    }
  }, [loadCurrentDappData, gnosisDisconnect])

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
        .catch(e => {
          console.error('tryAutoLoad:', e);
        })
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dappUrlFromLink, loadDappFromUrl, selectedAcc])

  return (
    <section className={styles.wrapper}>
      {isDappMode && currentDappData ?
        <GnosisSafeAppIframe
          className={styles.dappIframe}
          network={network}
          selectedApp={currentDappData}
          selectedAcc={selectedAcc}
          // removeApp={removeCustomPlugin}
          gnosisConnect={gnosisConnect}
          gnosisDisconnect={gnosisDisconnect}
        />
        :
        <div className={styles.dappCatalogInner}>
          <div>
            <div className={styles.filterSection}>
              {/* <div className={styles.inputIcon}> */}
              <TextInput className={styles.filterInput} inputContainerClass={styles.textInputContainer} value={search} onChange={onSearchChange} placeholder='Search filter' icon={<SearchIcon />} />
              {/* </div> */}
              <div className={styles.categories}>
                {categories.map(c => {
                  return <span
                    key={c.name}
                    className={cn(styles.category, styles[`category${c.name}`], { [styles.selected]: categoryFilter?.name === c.name })}
                    onClick={() => onCategorySelect(c)}>{CATEGORY_LABEL[c.name] || c.name}</span>
                })}
              </div>
            </div>

            <div className={styles.catalogItems}>
              <div className={cn(styles.catalogItem, styles.addCustomDapp)} >
                <div className={styles.tools}>
                  {/* <ToolTip label={`Click here to see how create dApp for Ambire Wallet catalog`}>
                    <a className={styles.infoBtn} href={'https://github.com/AmbireTech/wallet-dapp-catalog#readme'}
                      target="_blank"
                      rel="noreferrer noopener">
                      <MdBuildCircle size={23} />
                    </a>
                  </ToolTip> */}
                  <img className={styles.customDapp} src={DAPPS_ICON} alt='add custom dapps' />
                </div>
                <div className={styles.customDappIconWrapper}>
                  <img className={styles.customDappIcon} src={DAPPS_ICON} alt='add custom dapps icon' />
                </div>
                <Button border mini onClick={openCustomDappModal}>Add custom dApp</Button>
              </div>
              {
                sortFiltered(filteredCatalog).map(item => {
                  return <div className={cn(styles.catalogItem, {[styles.notSupported]: !item.supported})}
                    onClick={() => item.supported && openDapp(item)}
                    key={item.id}
                  >

                    <div className={styles.tools}>
                      {item.featured &&
                        <ToolTip label={`Hot dApp`} labelClassName={styles.tooltipLabel}>
                          <img className={cn(styles.icon, styles.hotDapp)} src={AMBIRE_ICON_HOT} alt='hot dApp icon' />
                        </ToolTip>
                      }
                      {item.custom &&
                        <ToolTip label={`Remove ${item.name} from your catalog`} labelClassName={styles.tooltipLabel}>
                          <MdDelete className={cn(styles.icon, styles.removeDapp)} onClick={(e) => onRemoveCustomClick(e, item)} />
                        </ToolTip>
                      }
                      {item.custom &&
                        <img className={cn(styles.customDapp, styles.icon)} src={DAPPS_ICON} alt='custom dapp icon' />
                      }
                      <ToolTip label={`${favorites[item.url] ? 'Remove' : 'Add'} ${item.name} ${favorites[item.url] ? 'from' : 'to'} favorites`} labelClassName={styles.tooltipLabel}>
                        <span className={cn(styles.favorite, {[styles.selected]: favorites[item.url]})} onClick={(e) => onFavoriteClick(e, item)}> {
                          favorites[item.url]
                            ? <AiFillStar className={styles.icon} /> :
                            <AiOutlineStar className={styles.icon} />

                        }</span>
                      </ToolTip>
                    </div>

                    <div className={styles.baseInfo}>
                      <div className={styles.logoSplit}>
                        <div className={styles.logo}>
                          <img src={item.iconUrl || DAPPS_ICON} alt={item.name} />
                        </div>
                        <div className={styles.content}>
                          <span className={styles.title}>{item.name}</span>
                        </div>
                      </div>
                      <div className={styles.description}>{item.description}</div>
                    </div>

                    <div>

                      {!item.supported &&
                        <div className={cn(styles.tagRow, styles.unsupported)}>
                          <span className={cn(styles.tag, styles.unsupported)}>{network.id} unsupported</span>
                        </div>
                      }

                      <div className={styles.alignedTagRows}>
                        {
                          !!item.networks?.length &&
                          <ToolTip htmlContent={getNetworkTooltipContent(item.networks)} >
                            <div className={cn(styles.tagRow, styles.networkTagRow)}>
                              {/* NOTE: remove reverse if there is way to match the design without flex-direction: row-reverse; */}
                              {
                                item.networks?.length > 3 &&
                                <span className={cn(styles.tag, styles.networkTag, styles.networkTagMore)}>...</span>
                              }
                              {
                                item.networks?.slice(0, 3).reverse().map((n) => {
                                  const network = NETWORKS.find(an => an.id === n)
                                  if (network) {
                                    return <span key={network.id} className={cn(styles.tag, styles.networkTag)}
                                      style={{ backgroundImage: `url(${network.icon})` }}></span>
                                  }
                                  return null
                                })
                              }
                            </div>
                          </ToolTip>
                        }

                        <div className={cn(styles.tagRow, styles.tagTypes)}>
                          <span className={cn(styles.tag, styles.typeTag, styles[`typeTag${item.category}`])}>{CONNECTION_TYPE_LABEL[item.category] || item.category}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                })
              }
            </div>
          </div>
          <div>
            {
              !(typeof filteredCatalog === 'object' && filteredCatalog.length > 0) ? <div className={styles.noDappFound}>
                No dApp found in our list matching your criteria
              </div> : null
            }

            <div className={styles.infoWc}>
              <MdInfo /> Note: any dApp that supports WalletConnect can be connected as well
            </div>
          </div>
        </div>
      }
    </section>
  )
}

export default DappsCatalog
