import { useCallback, useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'

import { useModals } from 'hooks'
import { Loading } from 'components/common'
import CollectiblesPlaceholder from './CollectiblesPlaceholder/CollectiblesPlaceholder'
import CollectiblesWrapper from './CollectiblesWrapper/CollectiblesWrapper'
import Collectible from './Collectible/Collectible'
import HideCollectibleModal from 'components/Modals/HideCollectibleModal/HideCollectibleModal'


const Collectibles = ({ portfolio, isPrivateMode, selectedNetwork }) => {
    const { showModal } = useModals()
    const history = useHistory()
    const collectiblesList = portfolio.collectibles
    const [isHideCollectiblesModalOpen, setIsHideCollectiblesModalOpen] = useState(false)
    
    const handleUri = uri => {
        if (!uri) return ''
        uri = uri.startsWith('data:application/json') ? uri.replace('data:application/json;utf8,', '') : uri

        if (uri.split('/')[0] === 'data:image') return uri
        if (uri.startsWith('ipfs://')) return uri.replace(/ipfs:\/\/ipfs\/|ipfs:\/\//g, 'https://ipfs.io/ipfs/')
        if (uri.split('/')[2].endsWith('mypinata.cloud')) return 'https://ipfs.io/ipfs/' + uri.split('/').slice(4).join('/')
        
        return uri
    }

    useEffect(() => history.replace(`/wallet/dashboard/collectibles`), [history])
    
    const openHideCollectibleModal = useCallback(() => setIsHideCollectiblesModalOpen(true), [])

    useEffect(() => {
        if(isHideCollectiblesModalOpen) {
            showModal(
                <HideCollectibleModal
                    portfolio={portfolio} 
                    setIsHideTokenModalOpen={setIsHideCollectiblesModalOpen} 
                    handleUri={handleUri}
                />
            )
        }
    }, [portfolio, isHideCollectiblesModalOpen, showModal])

    if (portfolio.loading) return <Loading />;

    if (!portfolio.collectibles.length || isPrivateMode) {
        return (
            <CollectiblesPlaceholder
                isPrivateMode={isPrivateMode}
                collectiblesLength={portfolio.collectibles.length}
            />
        );
    }

    return (
        <CollectiblesWrapper>
            {
                collectiblesList.map(({ network, address, collectionName, assets, balanceUSD }) => (assets || []).map(({ tokenId, data: { name, image } }) => (
                    <Collectible
                        key={tokenId}
                        href={`/wallet/nft/${selectedNetwork.id}/${address}/${tokenId}`}
                        collectionIcon={image}
                        collectionName={collectionName}
                        name={name}
                        image={handleUri(image)}
                        price={balanceUSD.toFixed(2)}
                    />
                )))
            }
            <button onClick={openHideCollectibleModal}>Open</button>
        </CollectiblesWrapper>  
    )
}

export default Collectibles