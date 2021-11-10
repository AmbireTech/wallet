import './Collectables.scss'

const Collectables = ({ collectables }) => {
    return (
        <div id="collectables">
            {
                collectables.map(({ tokens }) => tokens.map(({ collectionName, collectionImg, assets }) => assets.map(({ tokenId, assetName, assetImg, balanceUSD }) => (
                    <div className="collectable" key={tokenId}>
                        <div className="artwork" style={{backgroundImage: `url(${assetImg})`}}/>
                        <div className="info">
                            <div className="collection">
                                <div className="collection-icon" style={{backgroundImage: `url(${collectionImg})`}}></div>
                                { collectionName }
                            </div>
                            <div className="details">
                                <div className="name">{ assetName }</div>
                                <div className="value"><span className="purple-highlight">$</span> { balanceUSD.toFixed(2) }</div>
                            </div>
                        </div>
                    </div>
                ))))
            }
        </div>
    )
}

export default Collectables