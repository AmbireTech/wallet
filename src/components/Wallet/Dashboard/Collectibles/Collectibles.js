import CollectiblesPlaceholder from './CollectiblesPlaceholder/CollectiblesPlaceholder'
import { useHistory } from 'react-router-dom'
import { Loading } from 'components/common'

import Collectible from './Collectible/Collectible'

import styles from './Collectibles.module.scss'
import { useEffect } from 'react'

const Collectibles = ({ portfolio, isPrivateMode }) => {
    const history = useHistory()
    const collectiblesList = portfolio.collectibles
    
    const handleUri = uri => {
        if (!uri) return ''
        uri = uri.startsWith('data:application/json') ? uri.replace('data:application/json;utf8,', '') : uri

        if (uri.split('/')[0] === 'data:image') return uri
        if (uri.startsWith('ipfs://')) return uri.replace(/ipfs:\/\/ipfs\/|ipfs:\/\//g, 'https://ipfs.io/ipfs/')
        if (uri.split('/')[2].endsWith('mypinata.cloud')) return 'https://ipfs.io/ipfs/' + uri.split('/').slice(4).join('/')
        
        return uri
    }

    useEffect(() => history.replace(`/wallet/dashboard/collectibles`), [history])

    if (portfolio.isCurrNetworkProtocolsLoading) return <Loading />;

    if (!portfolio.collectibles.length || isPrivateMode) {
        return (
            <CollectiblesPlaceholder
                isPrivateMode={isPrivateMode}
                collectiblesLength={portfolio.collectibles.length}
            />
        );
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.collectiblesWrapper}>
                {
                    collectiblesList.map(({ network, address, collectionName, collectionImg, assets }) => (assets || []).map(({ tokenId, assetName, assetImg, balanceUSD }) => (
                        <Collectible
                            key={tokenId}
                            href={`/wallet/nft/${network}/${address}/${tokenId}`}
                            collectionIcon={collectionImg}
                            collectionName={collectionName}
                            name={assetName}
                            image={handleUri(assetImg)}
                            price={balanceUSD.toFixed(2)}
                        />
                    )))
                }
            </div>    
        </div>        
    )
}

export default Collectibles