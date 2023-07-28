import { useState, useMemo, useCallback, useEffect } from 'react'
import cn from 'classnames'
import { Button, Modal, TextInput, Radios, ToolTip } from 'components/common'
import { useModals } from 'hooks'
import { useToasts } from 'hooks/toasts'
import { MdImage, MdErrorOutline, MdBuildCircle } from 'react-icons/md'
import { fetch } from 'lib/fetch'
import NETWORKS from 'consts/networks'
import {
  getManifestFromDappUrl,
  getDappId,
  getNormalizedUrl
} from 'ambire-common/src/services/dappCatalog'
import { isValidUrl, isValidCustomDappData } from 'ambire-common/src/services/validations'
import DAPPS_ICON from 'resources/dapps.svg'

import styles from './AddCustomDappModal.module.scss'

const AddCustomDappModal = ({ dappsCatalog, dappUrl = '' }) => {
  const { addToast } = useToasts()
  const { hideModal } = useModals()

  const { addCustomDapp, isDappInCatalog } = dappsCatalog
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [iconUrl, setIconUrl] = useState(null)
  const [connectionType, setConnectionType] = useState('')
  const [loading, setLoading] = useState(false)
  const [urlErr, setUrlErr] = useState('Please enter a valid dApp URL')
  const [urlInfo, setUrlInfo] = useState(null)
  const [iconUrlInfo, setIconUrlInfo] = useState(null)
  const [networksInfo, setNetworksInfo] = useState(null)
  const [networks, setNetworks] = useState([])
  const [inputValidation, setInputValidation] = useState({})
  const [isAppAlreadyExists, setIsAppAlreadyExists] = useState(false)

  const disabled = useMemo(
    () => !inputValidation.success || isAppAlreadyExists || loading,
    [inputValidation.success, isAppAlreadyExists, loading]
  )

  const addDapp = useCallback(async () => {
    setLoading(true)

    addCustomDapp({
      id: getDappId(name),
      name,
      url,
      description,
      iconUrl: iconUrlInfo ? '' : iconUrl,
      connectionType,
      networks
    })

    addToast(`${name} added to Ambire Wallet dApp catalog`)

    setLoading(false)
    hideModal()
  }, [
    addCustomDapp,
    addToast,
    connectionType,
    description,
    hideModal,
    iconUrl,
    iconUrlInfo,
    name,
    networks,
    url
  ])

  const onUrlInput = useCallback(
    async (urlInputStr = '') => {
      setLoading(true)
      const normalizedDappUrl = getNormalizedUrl(urlInputStr)
      setUrl(normalizedDappUrl)
      setName('')
      setDescription('')
      setIconUrl('')
      setConnectionType('')
      setUrlInfo('')
      setIconUrlInfo('')
      setNetworksInfo('')
      const isValidUrlInput = isValidUrl(normalizedDappUrl)

      if (!isValidUrlInput) {
        setUrlErr(normalizedDappUrl ? 'Invalid Url' : null)
        setLoading(false)
        return
      }
      setUrlErr(null)
      const isInCatalog = isDappInCatalog(normalizedDappUrl)
      setIsAppAlreadyExists(isInCatalog)

      if (isInCatalog) {
        setLoading(false)
        return
      }

      try {
        const manifest = await getManifestFromDappUrl(fetch, normalizedDappUrl)

        setName(manifest.name)
        setDescription(manifest.description)
        setIconUrl(manifest.iconUrl)
        setConnectionType(manifest.connectionType)
        setNetworks(manifest.networks || [])
        setUrlInfo(isInCatalog ? `${normalizedDappUrl} is already in your wallet catalog` : '')
        setNetworksInfo(
          !manifest?.networks?.length
            ? 'Supported networks not detected! Please select manually.'
            : ''
        )
        setLoading(false)
      } catch (e) {
        setLoading(false)

        if (e?.cause && e?.message) {
          setUrlErr(e.message)
          return
        }
        addToast('Error while fetching dApp data', { error: true })
      }
    },
    [isDappInCatalog, addToast]
  )

  useEffect(() => {
    if (dappUrl) {
      onUrlInput(dappUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onNetworkClick = (network) => {
    setNetworks((prev) => {
      const index = prev.indexOf(network)
      const updated = [...prev]
      if (index >= 0) {
        updated.splice(index, 1)
      } else {
        updated.push(network)
      }

      return updated
    })
  }

  useEffect(() => {
    if (!name || isAppAlreadyExists) return

    setInputValidation(
      url
        ? isValidCustomDappData({
            id: getDappId(name || ''),
            name,
            url,
            description,
            iconUrl: iconUrlInfo ? '' : iconUrl,
            connectionType,
            networks
          })
        : {}
    )
  }, [
    connectionType,
    description,
    iconUrl,
    iconUrlInfo,
    name,
    networks,
    url,
    loading,
    isAppAlreadyExists
  ])

  return (
    <Modal
      className={styles.wrapper}
      contentClassName={styles.content}
      title={
        <div className={styles.customDappTitle}>
          <ToolTip label="Click here to see how create dApp for Ambire Wallet catalog">
            <a
              className={styles.infoBtn}
              href="https://github.com/AmbireTech/wallet-dapp-catalog#readme"
              target="_blank"
              rel="noreferrer noopener"
            >
              <MdBuildCircle className={styles.icon} />
            </a>
          </ToolTip>
          <div>Add custom dApp</div>
        </div>
      }
      buttons={
        <>
          <Button size="sm" variant="secondary" onClick={() => hideModal()}>
            Close
          </Button>
          <Button size="sm" variant="primaryGradient" disabled={disabled} onClick={addDapp}>
            Add
          </Button>
        </>
      }
    >
      <div>
        <TextInput
          value={url}
          label="URL*"
          onInput={(value) => onUrlInput(value)}
          className={styles.dappInput}
          inputContainerClass={styles.textInputContainer}
          placeholder="https://some.dapp.com"
        />
        <div className={styles.inputErr}>{urlErr || inputValidation?.errors?.url || urlInfo}</div>
      </div>

      <div
        className={cn(styles.data, {
          [styles.emptyUrl]: connectionType !== 'gnosis' || isAppAlreadyExists
        })}
      >
        <div>
          <TextInput
            small
            label="Name"
            value={name}
            onInput={(value) => setName(value)}
            className={styles.dappInput}
            inputContainerClass={styles.textInputContainer}
          />
          <div className={styles.inputErr}>{inputValidation?.errors?.name}</div>
        </div>
        <div>
          <TextInput
            small
            label="Description"
            value={description}
            onInput={(value) => setDescription(value)}
            className={styles.dappInput}
            inputContainerClass={styles.textInputContainer}
          />
        </div>

        <div>
          <div className={styles.iconInput}>
            <TextInput
              small
              label="Icon URL"
              value={iconUrl}
              onInput={(value) => {
                setIconUrl(value)
                setIconUrlInfo('')
              }}
              className={styles.dappInput}
              inputContainerClass={styles.textInputContainer}
            />
            <div className={styles.iconWrapper}>
              {iconUrl && !iconUrlInfo ? (
                <img
                  width={46}
                  height={46}
                  src={iconUrl || DAPPS_ICON}
                  alt={`${name || 'no'} logo`}
                  onError={() => {
                    setIconUrlInfo(
                      'Invalid icon URL, please update it or default dApp icon will be displayed'
                    )
                  }}
                />
              ) : iconUrlInfo ? (
                <MdErrorOutline size={40} />
              ) : (
                <MdImage size={40} />
              )}
            </div>
          </div>
          <div className={styles.inputErr}>{inputValidation?.errors?.iconUrl || iconUrlInfo}</div>
        </div>

        <div className={styles.networks}>
          <div>Supported networks ({networks.length} selected)</div>
          <div className={styles.networksContainer}>
            {NETWORKS.map((n) => {
              return (
                <ToolTip label={n.name} key={n.id}>
                  <span
                    className={cn(styles.networkTag, {
                      [styles.selected]: networks.includes(n.id)
                    })}
                    style={{ backgroundImage: `url(${n.icon})` }}
                    onClick={() => onNetworkClick(n.id)}
                  />
                </ToolTip>
              )
            })}
          </div>
          <div className={styles.inputErr}>{networksInfo || inputValidation?.errors?.networks}</div>
        </div>
      </div>
    </Modal>
  )
}
export default AddCustomDappModal
