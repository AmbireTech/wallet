import { useCallback, useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'

import { useModals } from 'hooks'
import { Loading } from 'components/common'
import AddOrHideButton from 'components/Wallet/Dashboard/AddOrHideButton/AddOrHideButton'
import CollectiblesPlaceholder from './CollectiblesPlaceholder/CollectiblesPlaceholder'
import CollectiblesWrapper from './CollectiblesWrapper/CollectiblesWrapper'
import Collectible from './Collectible/Collectible'
import AddOrHideCollectibleModal from 'components/Modals/AddOrHideCollectiblesModal/AddOrHideCollectibleModal'

const Collectibles = ({ network, portfolio, account, isPrivateMode, selectedNetwork, footer }) => {
    const { showModal } = useModals()
    const history = useHistory()
    const collectiblesList = portfolio.collectibles
    const [addOrHideCollectibleModal, setAddOrHideCollectibleModal] = useState({
        isOpen: false,
        defaultSection: 'Add Collectible'
    })
    const [isHideCollectiblesModalOpen, setIsHideCollectiblesModalOpen] = useState(false)
    const handleUri = uri => {
        if (!uri) return ''
        uri = uri.startsWith('data:application/json') ? uri.replace('data:application/json;utf8,', '') : uri

        if (uri.split('/').length === 1) return 'https://ipfs.io/ipfs/' + uri
        if (uri.split('/')[0] === 'data:image') return uri
        if (uri.startsWith('ipfs://')) return uri.replace(/ipfs:\/\/ipfs\/|ipfs:\/\//g, 'https://ipfs.io/ipfs/')
        if (uri.split('/')[2].endsWith('mypinata.cloud')) return 'https://ipfs.io/ipfs/' + uri.split('/').slice(4).join('/')
        
        return uri
    }

    useEffect(() => history.replace(`/wallet/dashboard/collectibles`), [history])
    
    const openHideCollectibleModal = useCallback(() => setIsHideCollectiblesModalOpen(true), [])
    const handleModalVisiblity = useCallback((value) => setAddOrHideCollectibleModal((prev) => ({...prev, isOpen: value})), [setAddOrHideCollectibleModal])

    useEffect(() => {
        if(isHideCollectiblesModalOpen) {
            showModal(
                <AddOrHideCollectibleModal
                    portfolio={portfolio} 
                    setIsHideCollectiblesModalOpen={setIsHideCollectiblesModalOpen} 
                    handleUri={handleUri}
                    handleModalVisiblity={handleModalVisiblity}
                    network={network}
                    account={account}
                    defaultSection={addOrHideCollectibleModal.defaultSection}
                />
            )
        }
    }, [portfolio, handleModalVisiblity, isHideCollectiblesModalOpen, addOrHideCollectibleModal, showModal, account, network])

    if (portfolio.loading) return <Loading />;

    if (!portfolio.collectibles.length || isPrivateMode) {
        return (
            <CollectiblesPlaceholder
                isPrivateMode={isPrivateMode}
                collectiblesLength={portfolio.collectibles.length}
                onClickShowCollectible={openHideCollectibleModal}
                footer={footer}
            />
        );
    }

    return (
        <CollectiblesWrapper 
            wrapperEndChildren={<>
                <AddOrHideButton onClick={openHideCollectibleModal}>Add or Hide Collectible</AddOrHideButton>
                { footer }
            </>
            }
        >
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
        </CollectiblesWrapper>  
    )
}

export default Collectibles