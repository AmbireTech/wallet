import './Collectibles.scss'

import { NavLink } from 'react-router-dom'
import CollectiblesPlaceholder from './CollectiblesPlaceholder/CollectiblesPlaceholder'
import { Loading } from 'components/common'

const Collectibles = ({ portfolio, isPrivateMode }) => {
    const handleUri = uri => {
        uri = uri.startsWith('data:application/json') ? uri.replace('data:application/json;utf8,', '') : uri

        if (uri.split('/')[0] === 'data:image') return uri
        if (uri.startsWith('ipfs://')) return uri.replace(/ipfs:\/\/ipfs\/|ipfs:\/\//g, 'https://ipfs.io/ipfs/')
        if (uri.split('/')[2].endsWith('mypinata.cloud')) return 'https://ipfs.io/ipfs/' + uri.split('/').slice(4).join('/')
        
        return uri
    }

    if (portfolio.isCurrNetworkProtocolsLoading) return <Loading />;
    console.log(portfolio.collectibles)
    if (!portfolio.collectibles.length || isPrivateMode) {
        return (
            <CollectiblesPlaceholder
                isPrivateMode={isPrivateMode}
                collectiblesLength={portfolio.collectibles.length}
            />
        );
    }

    return (
        <div id="collectibles">
            {
                portfolio.collectibles.map(({ network, address, collectionName, collectionImg, assets }) => (assets || []).map(({ tokenId, assetName, assetImg, balanceUSD }) => (
                    <div className="collectible" key={tokenId}>
                        <NavLink to={`/wallet/nft/${network}/${address}/${tokenId}`}>
                            <div className="artwork" style={{backgroundImage: `url(${handleUri(assetImg)})`}}/>
                            <div className="info">
                                <div className="collection">
                                    <div className="collection-icon" style={{backgroundImage: `url(${collectionImg})`}}></div>
                                    <span className="collection-name">{ collectionName }</span>
                                </div>
                                <div className="details">
                                    <div className="name">{ assetName }</div>
                                    <div className="value"><span className="purple-highlight">$</span> {balanceUSD.toFixed(2) }</div>
                                </div>
                            </div>
                        </NavLink>
                    </div>
                )))
            }
        </div>            
    )
}

export default Collectibles