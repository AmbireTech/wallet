import collectibles from './collectibles'

import { useLocalStorage } from 'hooks'
import Collectible from 'components/Wallet/Dashboard/Collectibles/Collectible/Collectible'
import CollectiblesWrapper from 'components/Wallet/Dashboard/Collectibles/CollectiblesWrapper/CollectiblesWrapper'

import styles from './CollectiblesPlaceholder.module.scss'

const CollectiblesPlaceholder = ({ isPrivateMode, collectiblesLength, footer, onClickShowCollectible }) => {
    const listHiddenCollectibles = useLocalStorage({ key: 'hiddenCollectibles'})
    let hiddenCollectiblesCount = 0
    
    if (listHiddenCollectibles && listHiddenCollectibles[0] !== null) {
        hiddenCollectiblesCount = listHiddenCollectibles[0].length
    }

    return (
        <CollectiblesWrapper 
            className={styles.blur}
            wrapperChildren={
                <div className={styles.placeholderOverlay}>
                    <div className={styles.placeholderText}>
                        {(isPrivateMode && collectiblesLength) ? <h2>
                            You can't see collectibles in private mode
                        </h2> : <h2>You don't have any collectibles (NFTs) yet</h2>}
                        {hiddenCollectiblesCount > 0 && (<p clear onClick={onClickShowCollectible}>
                            There are also {hiddenCollectiblesCount} hidden collectibles. Click to configure
                        </p>)}
                    </div>
                </div>
            }
            wrapperEndChildren={footer}
        >
            {
                collectibles.map(({ collectionName, collectionImg, name, image, price}) => (
                    <Collectible
                        key={name}
                        collectionIcon={collectionImg}
                        collectionName={collectionName}
                        image={image}
                        name={name}
                        price={price}
                        href="/wallet"
                    />
                ))
            }
        </CollectiblesWrapper>
    )

}

export default CollectiblesPlaceholder