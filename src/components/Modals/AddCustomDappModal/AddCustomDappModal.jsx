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

const getGnosisManifest = async (dAppUrl) => {
    const url = dAppUrl.toLowerCase().replace(/\/$/, '').replace('/manifest.json', '')
    const manifestUrl = url + '/manifest.json'

    const { body } = await fetchCaught(manifestUrl)

    const isGnosisManifest = !!body && body.name && body.description && body.iconPath && body

    const manifest = isGnosisManifest ? {
        ...body,
        iconUrl: body.iconUrl || url + '/' + body.iconPath.replace(/^\//, '')
    } : null


    return manifest
}

const isUrlReturnsResponse = async (dAppUrl) => {
    const { resp, errMsg } = await fetchCaught(dAppUrl)
    // TODO: detect CORS err - or remove this check
    return !!resp?.ok
}


const AddCustomDappModal = ({ dappsCatalog }) => {
    const { addToast } = useToasts()
    const { hideModal } = useModals()

    const { addCustomDapp } = dappsCatalog
    const [name, setName] = useState(null)
    const [url, setUrl] = useState(null)
    const [description, setDescription] = useState(null)
    const [loading, setLoading] = useState(false)
    const [showExtraData, setShowExtraData] = useState(false)
    const [urlErr, setUrlErr] = useState(null)
    const [gnosisManifest, setGnosisManifest] = useState(null)


    const disabled = !name || !url || loading

    const addDapp = useCallback(async () => {
        setLoading(true)
        const manifest = await getGnosisManifest(url)

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
        setGnosisManifest(null)
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

        const isValidDapp = await isUrlReturnsResponse(urlInputStr)

        if (!isValidDapp) {
            setLoading(false)
            setUrlErr('URL not responding')

            return
        }

        const manifest = await getGnosisManifest(urlInputStr)

        setGnosisManifest(manifest)
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

            {
                gnosisManifest &&
                <div>
                    <div>
                        <img width={46} height={46} src={gnosisManifest.iconUrl} alt={gnosisManifest.name + ' logo'} />
                    </div>
                    <div>
                        <span>Name:</span> <span>{gnosisManifest.name}</span>
                    </div>
                    <div>
                        <span>Description:</span> <span>{gnosisManifest.description}</span>
                    </div>
                </div>

            }

            {showExtraData &&
                <div>

                    <TextInput
                        label="Name"
                        onInput={value => setName(value)}
                    />

                    <TextInput
                        label="Description"
                        onInput={value => setDescription(value)}
                    />
                </div>

            }

        </Modal>
    )

}

export default AddCustomDappModal
