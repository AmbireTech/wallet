import './AddCustomDappModal.scss'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { Button, Modal, TextInput, Radios, ToolTip } from 'components/common'
import { useModals } from 'hooks'
import { useToasts } from 'hooks/toasts'
import { MdOutlineAdd, MdOutlineClose, MdImage, MdErrorOutline } from 'react-icons/md'
import { fetch } from 'lib/fetch'
import NETWORKS from 'consts/networks'
import { getManifestFromDappUrl, getDappId, getNormalizedUrl } from 'ambire-common/src/services/dappCatalog'
import { isValidUrl, isValidCustomDappData } from 'ambire-common/src/services/validations'
import DAPPS_ICON from 'resources/dapps.svg'

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
    const [urlErr, setUrlErr] = useState(null)
    const [urlInfo, setUrlInfo] = useState(null)
    const [iconUrlInfo, setIconUrlInfo] = useState(null)
    const [networksInfo, setNetworksInfo] = useState(null)
    const [networks, setNetworks] = useState([])
    const [inputValidation, setInputValidation] = useState({})
    const [isAppAlreadyExists, setIsAppAlreadyExists] = useState(false)

    const disabled = useMemo(() => !inputValidation.success || isAppAlreadyExists || loading, [inputValidation.success, isAppAlreadyExists, loading])

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
    }, [addCustomDapp, addToast, connectionType, description, hideModal, iconUrl, iconUrlInfo, name, networks, url])

    const onUrlInput = useCallback(async (urlInputStr = '') => {
        const normalizedDappUrl = getNormalizedUrl(urlInputStr)
        setUrl(normalizedDappUrl)
        setName('')
        setDescription('')
        setIconUrl('')
        setConnectionType('')
        setUrlInfo('')
        setIconUrlInfo('')
        setNetworksInfo('')
        setLoading(true)
        const isValidUrlInput = isValidUrl(normalizedDappUrl)

        if (!isValidUrlInput) {
            setUrlErr(!!normalizedDappUrl ? 'Invalid Url' : null)
            setLoading(false)
            return
        } else (
            setUrlErr(null)
        )
        const isInCatalog = isDappInCatalog(normalizedDappUrl)
        setIsAppAlreadyExists(isInCatalog)

        const manifest = await getManifestFromDappUrl(fetch, normalizedDappUrl)

        if (manifest) {
            setName(manifest.name)
            setDescription(manifest.description)
            setIconUrl(manifest.iconUrl)
            setConnectionType(manifest.connectionType)
            setNetworks(manifest.networks || [])
            setUrlInfo(isInCatalog ? `${normalizedDappUrl} is already in your wallet catalog` : '')
            setNetworksInfo(!manifest?.networks?.length ? `Supported networks not detected! Please select manually.` : '')
        } else {
            setUrlInfo('Cant find dApp data - make sure it supports gnosis safe apps ot WalletConnect')
        }

        setLoading(false)
    }, [isDappInCatalog])

    const onRadioChange = useCallback(value => {
        setConnectionType(value)
    }, [])

    const radios = useMemo(() => [
        {
            label: 'Gnosis safe app',
            value: 'gnosis',
            disabled: !url || urlErr
        },
        {
            label: 'WalletConnect',
            value: 'walletconnect',
            disabled: !url || urlErr
        }
    ], [url, urlErr])

    useEffect(() => {
        console.log({dappUrl})
        if (dappUrl) {
            onUrlInput(dappUrl)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const buttons = useMemo(() =>
        <>
            <Button clear icon={<MdOutlineClose />} onClick={() => hideModal()}>Close</Button>
            <Button icon={<MdOutlineAdd />} disabled={disabled} onClick={addDapp}>Add</Button>
        </>
        , [addDapp, disabled, hideModal])

    const onNetworkClick = (network) => {
        setNetworks(prev => {
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
        setInputValidation(url ? isValidCustomDappData({
            id: getDappId(name || ''),
            name,
            url,
            description,
            iconUrl: iconUrlInfo ? '' : iconUrl,
            connectionType,
            networks
        }) : {})
    }, [connectionType, description, iconUrl, iconUrlInfo, name, networks, url])

    return (
        <Modal id='add-custom-dapp-modal' title='Add custom dApp' buttons={buttons}>
            <div>
                <TextInput
                    value={url}
                    label="URL"
                    onInput={value => onUrlInput(value)}
                    className='dapp-input'
                    placeholder='https://some.dapp.com'
                />
                {<div className='input-err' >
                    {urlErr || inputValidation?.errors?.url || urlInfo}
                </div>}
            </div>

            <div>
                <TextInput
                    small
                    label="Name"
                    value={name}
                    onInput={value => setName(value)}
                    className='dapp-input'
                />
                {<div className='input-err' >
                    {inputValidation?.errors?.name}
                </div>}
            </div>
            <div>
                <TextInput
                    small
                    label="Description"
                    value={description}
                    onInput={value => setDescription(value)}
                    className='dapp-input'
                />
            </div>

            <div>
                <div className='icon-input'>
                    <TextInput
                        small
                        label="Icon Url"
                        value={iconUrl}
                        onInput={value => { setIconUrl(value); setIconUrlInfo('') }}
                        className='dapp-input'
                    />
                    <div className='icon-wrapper'>
                        {

                            iconUrl && !iconUrlInfo ?
                                <img width={46} height={46} src={iconUrl || DAPPS_ICON} alt={(name || 'no') + ' logo'}
                                    onError={() => {
                                        setIconUrlInfo('Invalid icon URL, please update it or default dApp icon will be displayed');
                                    }} />
                                : iconUrlInfo ? <MdErrorOutline size={40} /> : <MdImage size={40} />}
                    </div>
                </div>
                {<div className='input-err' >
                    {inputValidation?.errors?.iconUrl || iconUrlInfo}
                </div>}
            </div>

            <div>
                <div className='connection-radios'>
                    <div>Connection type</div>
                    <Radios radios={radios} value={connectionType} onChange={onRadioChange} row />
                </div>
                {<div className='input-err' >
                    {inputValidation?.errors?.connectionType}
                </div>}
            </div>

            <div className='networks'>
                <div>Supported network ({networks.length} selected)</div>
                <div className='networks-container'>
                    {
                        NETWORKS.map(n => {
                            return (
                                <ToolTip label={n.name} key={n.id}>
                                    <span className={`network-tag${networks.includes(n.id) ? ' selected' : ''}`}
                                        style={{ backgroundImage: `url(${n.icon})` }}
                                        onClick={() => onNetworkClick(n.id)}
                                    >
                                    </span>
                                </ToolTip>
                            )
                        })
                    }
                </div>
                {<div className='input-err' >
                    {networksInfo || inputValidation?.errors?.networks}
                </div>}
            </div>
        </Modal>
    )

}

export default AddCustomDappModal
