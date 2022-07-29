import './AddCustomDappModal.scss'
import { useState, useMemo, useCallback } from 'react'
import { Button, Modal, TextInput, Radios, ToolTip } from 'components/common'
import { useModals } from 'hooks'
import { useToasts } from 'hooks/toasts'
import { MdOutlineAdd, MdOutlineClose, MdImage } from 'react-icons/md'
import { fetchCaught } from 'lib/fetch'
import NETWORKS from 'consts/networks'

const isUrl = (str) => {
    try { return Boolean(new URL(str)); }
    catch (e) { return false }
}

const getNormalizedUrl = (inputStr) => {
    const url = inputStr.toLowerCase().split(/[?#]/)[0].replace('/manifest.json', '')
    return url
}

const toDappId = (name = '') => {
    return name.toLowerCase().replace(/s/g, '_') + '_' + Date.now()
}

const getManifest = async (dAppUrl) => {
    const url = dAppUrl.replace(/\/$/, '')
    const manifestUrl = url + '/manifest.json'

    const { body } = await fetchCaught(manifestUrl)

    const hasManifest = !!body && body.name

    const isGnosisManifest = hasManifest && body.description && body.iconPath
    const isStandardManifest = hasManifest && Array.isArray(body.icons) && body.icons.length

    const manifest = isGnosisManifest ? {
        ...body,
        iconUrl: body.iconUrl || url + '/' + body.iconPath.replace(/^\//, ''),
        connectionType: 'gnosis'
    }
        : isStandardManifest ?
            {
                name: body.name,
                description: body.name,
                iconUrl: url + '/' + body.icons[0]?.src.replace(/^\//, ''),
                connectionType: 'walletconnect'
            }
            : null


    return manifest
}


const AddCustomDappModal = ({ dappsCatalog }) => {
    const { addToast } = useToasts()
    const { hideModal } = useModals()

    const { addCustomDapp } = dappsCatalog
    const [name, setName] = useState('')
    const [url, setUrl] = useState('')
    const [description, setDescription] = useState('')
    const [iconUrl, setIconUrl] = useState('')
    const [connectionType, setConnectionType] = useState('')
    const [loading, setLoading] = useState(false)
    const [urlErr, setUrlErr] = useState(null)
    const [urlInfo, setUrlInfo] = useState(null)
    const [networks, setNetworks] = useState([])
    const [dappManifest, setDappManifest] = useState(null)


    const disabled = !name || !url || loading

    const addDapp = useCallback(async () => {
        setLoading(true)

        addCustomDapp({
            id: toDappId(name),
            name,
            url,
            description,
            iconUrl,
            connectionType,
            networks
        })

        addToast(`${name} added to Ambire Wallet dApp catalog`)

        setLoading(false)
        hideModal()
    }, [addCustomDapp, addToast, connectionType, description, hideModal, iconUrl, name, networks, url])

    const onUrlInput = useCallback(async (urlInputStr = '') => {
        const url = getNormalizedUrl(urlInputStr)
        setUrl(url)
        setDappManifest(null)
        setName('')
        setDescription('')
        setIconUrl('')
        setConnectionType('')
        setLoading(true)
        const isValidUrl = isUrl(url)

        if (!isValidUrl) {
            setUrlErr(!!url ? 'Invalid Url' : null)
            setLoading(false)
            return
        } else (
            setUrlErr(null)
        )

        const manifest = await getManifest(url)

        if (manifest) {
            setName(manifest.name)
            setDescription(manifest.description)
            setIconUrl(manifest.iconUrl)
            setConnectionType(manifest.connectionType)
            setUrlInfo('')
        } else {
            setUrlInfo('Cant find dApp data - make sure it supports gnosis safe apps ot WalletConnect')
        }

        setDappManifest(manifest)
        setLoading(false)
    }, [])

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

    return (
        <Modal id='add-custom-dapp-modal' title='Add custom dApp' buttons={buttons}>
            <div>
                <TextInput
                    value={url}
                    label="URL"
                    onInput={value => onUrlInput(value)}
                    className='dapp-input'
                />
                {<div>
                    {urlErr || urlInfo}
                </div>
                }
            </div>

            <TextInput
                small
                label="Name"
                value={name}
                onInput={value => setName(value)}
                className='dapp-input'
            />

            <TextInput
                small
                label="Description"
                value={description}
                onInput={value => setDescription(value)}
                className='dapp-input'
            />

            <div className='icon-input'>
                <TextInput
                    small
                    label="Icon Url"
                    value={iconUrl}
                    onInput={value => setIconUrl(value)}
                    className='dapp-input'
                />
                <div className='icon-wrapper'>
                    {iconUrl ? <img width={46} height={46} src={iconUrl} alt={(name || 'no') + ' logo'} />
                        : <MdImage />}
                </div>
            </div>
            <div const>

            </div>
            <div className='connection-radios'>
                <div>Connection type</div>
                <Radios radios={radios} value={connectionType} onChange={onRadioChange} row />
            </div>
            <div className='networks'>
                <div>Supported network ({networks.length} selected)</div>
                <div className='networks-container'>
                    {
                        NETWORKS.map(n => {
                            return (
                                <ToolTip label={n.name} >
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
            </div>


        </Modal>
    )

}

export default AddCustomDappModal
