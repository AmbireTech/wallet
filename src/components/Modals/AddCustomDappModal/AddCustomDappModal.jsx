import './AddCustomDappModal.scss'
import { useState, useMemo } from 'react'
import { Button, Modal, TextInput } from 'components/common'
import { useModals } from 'hooks'
import { useToasts } from 'hooks/toasts'
import { MdOutlineAdd, MdOutlineClose } from 'react-icons/md'


const AddCustomDappModal = ({ dappsCatalog }) => {
    const { addToast } = useToasts()
    const { hideModal } = useModals()

    const { addCustomDapp } = dappsCatalog
    const [name, setName] = useState(null)
    const [url, setUrl] = useState(null)
    const [description, setDescription] = useState(null)


    const disabled = !name || !url

    const addDapp = useMemo(() => {
        // TODO: fetch dapp manifest ig gnosis

        addCustomDapp({
            name,
            url,
            description
        })

        addToast(`${name} added to Ambire Wallet dApp catalog`)
    }, [addCustomDapp, addToast, description, name, url])

    const buttons = useMemo(() =>
        <>
            <Button clear icon={<MdOutlineClose />} onClick={() => hideModal()}>Close</Button>
            <Button icon={<MdOutlineAdd />} disabled={disabled} onClick={addDapp}>Add</Button>
        </>
        , [addDapp, disabled, hideModal])

    return (
        <Modal id='add-custom-dapp-modal' title='Add custom dApp' buttons={buttons}>
            <TextInput
                label="Name"
                onInput={value => setName(value)}
            />
            <TextInput
                label="URL"
                onInput={value => setUrl(value)}
            />
            <TextInput
                label="Description"
                onInput={value => setDescription(value)}
            />

        </Modal>
    )

}

export default AddCustomDappModal
