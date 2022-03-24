import './Collectible.scss'

import { useParams } from 'react-router-dom'
import { ethers } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { useCallback, useEffect, useState } from 'react'
import { AiOutlineSend } from 'react-icons/ai'
import { BsFillImageFill } from 'react-icons/bs'
import * as blockies from 'blockies-ts';
import { useToasts } from 'hooks/toasts'
import { TextInput, Button, Loading, AddressBook, AddressWarning, ToolTip } from 'components/common'
import ERC721Abi from 'consts/ERC721Abi'
import networks from 'consts/networks'
import { validateSendNftAddress } from 'lib/validations/formValidations'
import { BsXLg } from 'react-icons/bs'
import { getProvider } from 'lib/provider'
import { VELCRO_API_ENDPOINT } from 'config'
import { fetchGet } from 'lib/fetch'
import { resolveUDomain } from 'hooks/unstoppabledomains'

const ERC721 = new Interface(ERC721Abi)

const handleUri = uri => {
    uri = uri.startsWith('data:application/json') ? uri.replace('data:application/json;utf8,', '') : uri

    if (uri.startsWith('ipfs://')) return uri.replace(/ipfs:\/\/ipfs\/|ipfs:\/\//g, 'https://ipfs.io/ipfs/')
    if (uri.split('/')[2].endsWith('mypinata.cloud')) return 'https://ipfs.io/ipfs/' + uri.split('/').slice(4).join('/')
        
    return uri
}

const Collectible = ({ selectedAcc, selectedNetwork, addRequest, addressBook }) => {
    const { addresses, addAddress, removeAddress, isKnownAddress } = addressBook

    const { addToast } = useToasts()
    const { network, collectionAddr, tokenId } = useParams()
    const [isLoading, setLoading] = useState(true)
    const [metadata, setMetadata] = useState({
        owner: {
            address: '',
            icon: ''
        },
        name: '',
        description: '',
        image: '',
        collection: '',
        explorerUrl: ''
    })
    const [recipientAddress, setRecipientAddress] = useState('')
    const [uDAddress, setUDAddress] = useState('')
    const [isTransferDisabled, setTransferDisabled] = useState(true)
    const [addressConfirmed, setAddressConfirmed] = useState(false)
    const [newAddress, setNewAddress] = useState(null)
    const [validationFormMgs, setValidationFormMgs] = useState({ 
        success: false, 
        message: ''
    })

    const sendTransferTx = () => {
        const recipAddress = uDAddress ? uDAddress : recipientAddress

        if (uDAddress) {
            const isAlreadyAdded = addresses.find(i => i.address === uDAddress)

            if (!isAlreadyAdded) {
                addAddress(recipientAddress, uDAddress)
            }
        }

        try {
            addRequest({
                id: `transfer_nft_${Date.now()}`,
                type: 'eth_sendTransaction',
                chainId: selectedNetwork.chainId,
                account: selectedAcc,
                txn: {
                    to: collectionAddr,
                    value: '0',
                    data: ERC721.encodeFunctionData('transferFrom', [metadata.owner.address, recipAddress, tokenId])
                }
            })
        } catch(e) {
            console.error(e)
            addToast(`Error: ${e.message || e}`, { error: true })
        }
    }

    useEffect(() => {
        const validateForm = async() => {
            const UDAddress =  await resolveUDomain(recipientAddress, null, selectedNetwork.unstoppableDomainsChain)
            
            let isAddressValid
            if (UDAddress) {
                isAddressValid = validateSendNftAddress(UDAddress, selectedAcc, addressConfirmed, isKnownAddress, metadata, selectedNetwork, network)
                setUDAddress(UDAddress)
            } else {
                isAddressValid = validateSendNftAddress(recipientAddress, selectedAcc, addressConfirmed, isKnownAddress, metadata, selectedNetwork, network)
                setUDAddress('')
            }

            setTransferDisabled(!isAddressValid.success)
            setValidationFormMgs({ 
                success: isAddressValid.success, 
                message: isAddressValid.message ? isAddressValid.message : ''
            })
        }
        const timer = setTimeout(() => validateForm().catch(console.error), 500)
        return () => clearTimeout(timer)
    }, [recipientAddress, metadata, selectedNetwork, selectedAcc, network, addressConfirmed, isKnownAddress])

    const fetchMetadata = useCallback(async () => {
        setLoading(true)
        setMetadata({})
    
        try {
            const networkDetails = networks.find(({ id }) => id === network)
            if (!networkDetails) throw new Error('This network is not supported')

            const { explorerUrl } = networkDetails
            const provider = getProvider(networkDetails.id)
            const contract = new ethers.Contract(collectionAddr, ERC721Abi, provider)

            const [collection, address, maybeUri1, maybeUri2] = await Promise.all([
                contract.name(),
                contract.ownerOf(tokenId),
                contract.tokenURI(tokenId).then(uri => ({ uri })).catch(err => ({ err })),
                contract.uri(tokenId).then(uri => ({ uri })).catch(err => ({ err }))
            ])
            const uri = maybeUri1.uri || maybeUri2.uri
            if (!uri) throw maybeUri1.err || maybeUri2.err

            let json = {}

            if (uri.startsWith('data:application/json')) {
                json = JSON.parse(uri.replace('data:application/json;utf8,', ''))
            } else {
                const jsonUrl = handleUri(uri)
                const response = await fetch(jsonUrl)
                json = await response.json()
            }

            const image = json ? handleUri(json.image) : null
            setMetadata(metadata => ({
                ...metadata,
                ...json,
                image
            }))

            setMetadata(metadata => ({
                ...metadata,
                collection,
                owner: {
                    address,
                    icon: blockies.create({ seed: address }).toDataURL()
                },
                explorerUrl
            }))

            setLoading(false)
        } catch(e) {
            try {
                const { success, collection, description, image, name, owner, message } = await fetchGet(
                    `${VELCRO_API_ENDPOINT}/nftmeta/${collectionAddr}/${tokenId}?network=${network}`
                    )                
                if (!success) throw new Error(message)

                const networkDetails = networks.find(({ id }) => id === network)
                if (!networkDetails) throw new Error('This network is not supported')
                
                const { explorerUrl } = networkDetails
                setMetadata(metadata => ({
                    ...metadata,
                    collection,
                    description,
                    image,
                    name,
                    owner: {
                        address: owner,
                        icon: blockies.create({ seed: owner }).toDataURL()
                    },
                    explorerUrl
                })) 
                
                setLoading(false)
            } catch(e) {
                console.error(e)
                addToast(`Collectible error: ${e.message || e}`, { error: true })
            }
        }
    }, [addToast, tokenId, collectionAddr, network])

    useEffect(() => fetchMetadata(), [fetchMetadata])

    return (
        <div id="collectible">
            <div className="panel">
                <div className="heading">
                    <div className="title">{ metadata.collection } #{ tokenId }</div>
                    <div className="contract">
                        Contract address: <a className="address" href={`${metadata.explorerUrl}/address/${collectionAddr}`} target="_blank" rel="noreferrer">{ collectionAddr }</a>
                    </div>
                </div>
                {
                    isLoading ?
                        <Loading/>
                        :
                        <div className="metadata">
                            <div className="image" style={{backgroundImage: `url(${handleUri(metadata.image)})`}}>
                                { !metadata.image ? <BsFillImageFill/> : null }
                            </div>
                            <div className="info">
                                <div className="name">
                                    { metadata.name }
                                </div>
                                <div className="description">
                                    { metadata.description }
                                </div>
                            </div>
                            <div className="owner">
                                Owner:
                                <a className="address" href={`${metadata.explorerUrl}/address/${metadata.owner.address}`} target="_blank" rel="noreferrer">
                                    <div className="icon" style={{backgroundImage: `url(${metadata.owner.icon})`}}></div>
                                    { 
                                        metadata.owner.address === selectedAcc ? 
                                            <span>You ({ metadata.owner.address })</span>
                                            :
                                            metadata.owner.address
                                    }
                                    
                                </a>
                            </div>
                        </div>
                }
            </div>
            <div className="panel">
                <div className="title">Transfer</div>
                <div className="content">
                    <div id="recipient-address">
                        <TextInput placeholder="Recipient Address" value={recipientAddress} onInput={(value) => setRecipientAddress(value)}/>
                        <ToolTip label={!uDAddress ? 'It can be used with unstoppable domains.' : 'Valid unstoppable domain.'}>
                            <div id="udomains-logo" className={uDAddress ? 'ud-logo-active ' : ''} />
                        </ToolTip>
                        <AddressBook 
                            addresses={addresses.filter(x => x.address !== selectedAcc)}
                            addAddress={addAddress}
                            removeAddress={removeAddress}
                            newAddress={newAddress}
                            onClose={() => setNewAddress(null)}
                            onSelectAddress={address => setRecipientAddress(address)}
                        />
                    </div>
                    { validationFormMgs.message && 
                        (<div className='validation-error'><BsXLg size={12}/>&nbsp;{validationFormMgs.message}</div>) 
                    }
                    <div className="separator"></div>
                    <AddressWarning
                        address={uDAddress ? uDAddress : recipientAddress}
                        onAddNewAddress={() => setNewAddress(uDAddress ? uDAddress : recipientAddress)}
                        onChange={(value) => setAddressConfirmed(value)}
                        isKnownAddress={isKnownAddress}
                    />
                    <Button icon={<AiOutlineSend/>} disabled={isTransferDisabled} onClick={sendTransferTx}>Send</Button>
                </div>
            </div>
        </div>
    )
}

export default Collectible
