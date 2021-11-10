import './Collectable.scss'

import { useParams } from 'react-router-dom'
import { ethers, getDefaultProvider } from 'ethers'
import { useCallback, useEffect, useState } from 'react'
import { useToasts } from '../../../hooks/toasts'
import { TextInput, Button } from '../../common'
import ERC721Abi from '../../../consts/ERC721Abi'

const Collectable = ({ allNetworks }) => {
    const { addToast } = useToasts()
    const { network, collectionAddr, tokenId } = useParams()
    const [metadata, setMetadata] = useState({
        name: '',
        description: '',
        image: '',
        collection: ''
    })

    const { rpc } = allNetworks.find(({ id }) => id === network)
    const provider = getDefaultProvider(rpc)

    const contract = new ethers.Contract(collectionAddr, ERC721Abi, provider)

    const fetchMetadata = useCallback(async () => {
        try {
            let collection = await contract.name()
            setMetadata(metadata => ({
                ...metadata,
                collection
            }))
        } catch(e) {
            addToast('Failed to fetch collection name', { error: true })
        }

        try {
            let url = await contract.tokenURI(tokenId)
            if (url.startsWith('ipfs://')) url = url.replace('ipfs://', 'https://ipfs.io/ipfs/')

            const response = await fetch(url)
            const data = await response.json()
            setMetadata(metadata => ({
                ...metadata,
                ...data
            }))
        } catch(e) {
            addToast('Failed to fetch metadata', { error: true })
        }
    }, [])

    useEffect(() => {
        fetchMetadata()
    }, [fetchMetadata])

    return (
        <div id="collectable">
            <div className="panel">
                <div className="title">{ metadata.collection } #{ tokenId }</div>
               <div className="metadata">
                    <div className="image" style={{backgroundImage: `url(${metadata.image})`}}></div>
                    <div className="info">
                        <div className="name">
                            { metadata.name }
                        </div>
                        <div className="description">
                            { metadata.description }
                        </div>
                    </div>
               </div>
            </div>
            <div className="panel">
                <div className="title">Transfer</div>
                <div className="content">
                    <TextInput placeholder="Recipient"/>
                    <div className="separator"></div>
                    <Button>Send</Button>
                </div>
            </div>
        </div>
    )
}

export default Collectable