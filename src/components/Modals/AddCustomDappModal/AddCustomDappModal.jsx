import './AddCustomDappModal.scss'
import { useState, useMemo, useCallback } from 'react'
import { Button, Modal, TextInput } from 'components/common'
import { useModals } from 'hooks'
import { useToasts } from 'hooks/toasts'
import { MdOutlineAdd, MdOutlineClose } from 'react-icons/md'
import { fetchCaught } from 'lib/fetch'

const isUrl = (str) => {
    try { return Boolean(new URL(str)); }
    catch (e) { return false }
}

const getManifest = async (dAppUrl) => {
    const url = dAppUrl.toLowerCase().replace(/\/$/, '').replace('/manifest.json', '')
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
    const [name, setName] = useState(null)
    const [url, setUrl] = useState(null)
    const [description, setDescription] = useState(null)
    const [iconUrl, setIconUrl] = useState(null)
    const [connectionType, setConnectionType] = useState(null)
    const [loading, setLoading] = useState(false)
    const [showExtraData, setShowExtraData] = useState(false)
    const [urlErr, setUrlErr] = useState(null)
    const [dappManifest, setDappManifest] = useState(null)


    const disabled = !name || !url || loading

    const addDapp = useCallback(async () => {
        setLoading(true)
        const manifest = await getManifest(url)

        if (!manifest) return

        addCustomDapp({
            name,
            url,
            description
        })

        addToast(`${name} added to Ambire Wallet dApp catalog`)

        setLoading(false)
    }, [addCustomDapp, addToast, description, name, url])

    const onUrlInput = useCallback(async (urlInputStr = '') => {
        setUrl(urlInputStr)
        setDappManifest(null)
        setLoading(true)
        setShowExtraData(false)
        const isValidUrl = isUrl(urlInputStr)

        if (!isValidUrl) {
            setUrlErr(!!urlInputStr ? 'Invalid Url' : null)
            setLoading(false)
            return
        } else (
            setUrlErr(null)
        )

        const manifest = await getManifest(urlInputStr)

        if (manifest) {
            setName(manifest.name)
            setDescription(manifest.description)
            setIconUrl(manifest.iconUrl)
            setConnectionType(manifest.connectionType)
        }

        setDappManifest(manifest)
        setShowExtraData(!manifest)

        setLoading(false)
    }, [])

    const buttons = useMemo(() =>
        <>
            <Button clear icon={<MdOutlineClose />} onClick={() => hideModal()}>Close</Button>
            <Button icon={<MdOutlineAdd />} disabled={disabled} onClick={addDapp}>Add</Button>
        </>
        , [addDapp, disabled, hideModal])

    return (
        <Modal id='add-custom-dapp-modal' title='Add custom dApp' buttons={buttons}>
            <div>
                <TextInput
                    label="URL"
                    onInput={value => onUrlInput(value)}
                />
                {<div>
                    {urlErr}
                </div>
                }
            </div>

            <TextInput
                small
                label="Name"
                value={name}
                onInput={value => setName(value)}
            />

            <TextInput
                small
                label="Description"
                value={description}
                onInput={value => setDescription(value)}
            />

            <div className='icon-input'>
                <TextInput
                    small
                    label="Icon Url"
                    value={iconUrl}
                    onInput={value => setIconUrl(value)}
                />
                <div className='icon-wrapper'>
                    <img width={46} height={46} src={iconUrl} alt={(name || 'no') + ' logo'} />
                </div>
            </div>


        </Modal>
    )

}

export default AddCustomDappModal
