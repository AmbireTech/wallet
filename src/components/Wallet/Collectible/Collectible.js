import './Collectible.scss'

import { useParams } from 'react-router-dom'
import { ethers, getDefaultProvider } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { useCallback, useEffect, useState } from 'react'
import { AiOutlineSend } from 'react-icons/ai'
import { BsFillImageFill } from 'react-icons/bs'
import * as blockies from 'blockies-ts';
import { useToasts } from '../../../hooks/toasts'
import { TextInput, Button, Loading, AddressBook, AddressWarning } from '../../common'
import ERC721Abi from '../../../consts/ERC721Abi'
import networks from '../../../consts/networks'
import { isValidAddress, isKnownTokenOrContract } from '../../../helpers/address';

const ERC721 = new Interface(ERC721Abi)

const handleUri = uri => {
    uri = uri.startsWith('data:application/json') ? uri.replace('data:application/json;utf8,', '') : uri
    return uri.startsWith('ipfs://') ? uri.replace(/ipfs:\/\/ipfs\/|ipfs:\/\//g, 'https://ipfs.io/ipfs/') : uri
}

const Collectible = ({ selectedAcc, selectedNetwork, addRequest, addresses, addAddress, removeAddress, isKnownAddress }) => {
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
    const [isTransferDisabled, setTransferDisabled] = useState(true)
    const [addressConfirmed, setAddressConfirmed] = useState(false)
    const [newAddress, setNewAddress] = useState(null)

    const sendTransferTx = () => {
        try {
            addRequest({
                id: `transfer_nft_${Date.now()}`,
                type: 'eth_sendTransaction',
                chainId: selectedNetwork.chainId,
                account: selectedAcc,
                txn: {
                    to: collectionAddr,
                    value: '0',
                    data: ERC721.encodeFunctionData('transferFrom', [metadata.owner.address, recipientAddress, tokenId])
                }
            })
        } catch(e) {
            console.error(e)
            addToast(`Error: ${e.message || e}`, { error: true })
        }
    }

    useEffect(() => {
        setTransferDisabled(isKnownTokenOrContract(recipientAddress) || !isValidAddress(recipientAddress) || selectedAcc === recipientAddress || metadata.owner?.address !== selectedAcc || selectedNetwork.id !== network || (!isKnownAddress(recipientAddress) && !addressConfirmed))
    }, [recipientAddress, metadata, selectedNetwork, selectedAcc, network, addressConfirmed, isKnownAddress])

    const fetchMetadata = useCallback(async () => {
        setLoading(true)
        setMetadata({})
    
        try {
            const networkDetails = networks.find(({ id }) => id === network)
            if (!networkDetails) throw new Error('This network is not supported')

            const { rpc, explorerUrl } = networkDetails
            const provider = getDefaultProvider(rpc)
            const contract = new ethers.Contract(collectionAddr, ERC721Abi, provider)

            const [collection, address, uri] = await Promise.all([
                contract.name(),
                contract.ownerOf(tokenId),
                contract.tokenURI(tokenId)
            ])

            try {
                let json = {}

                if (uri.startsWith('data:application/json')) {
                    json = JSON.parse(uri.replace('data:application/json;utf8,', ''))
                } else {
                    const jsonUrl = handleUri(uri)
                    const response = await fetch(jsonUrl)
                    json = await response.json()
                }

                setMetadata(metadata => ({
                    ...metadata,
                    ...json,
                    image: json ? handleUri(json.image) : null
                }))
            } catch(e) {
                throw e
            }

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
            console.error(e)
            addToast(`Error: ${e.message || e}`, { error: true })
        }
    }, [addToast, tokenId, collectionAddr, network])

    useEffect(() => fetchMetadata(), [fetchMetadata])

    return (
        <div id="collectible">
            <div className="panel">
                <div className="title">
                    { metadata.collection } #{ tokenId }
                    <div className="contract">
                        Contract address: <a className="address" href={`${metadata.explorerUrl}/address/${collectionAddr}`} target="_blank" rel="noreferrer">{ collectionAddr }</a>
                    </div>
                </div>
                {
                    isLoading ?
                        <Loading/>
                        :
                        <div className="metadata">
                            <div className="image" style={{backgroundImage: `url(${metadata.image})`}}>
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
                        <AddressBook 
                            addresses={addresses}
                            addAddress={addAddress}
                            removeAddress={removeAddress}
                            newAddress={newAddress}
                            onClose={() => setNewAddress(null)}
                            onSelectAddress={address => setRecipientAddress(address)}
                        />
                    </div>
                    <div className="separator"></div>
                    <AddressWarning
                        address={recipientAddress}
                        onAddNewAddress={() => setNewAddress(recipientAddress)}
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