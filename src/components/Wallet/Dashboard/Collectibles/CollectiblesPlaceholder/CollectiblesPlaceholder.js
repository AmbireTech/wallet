import Collectible from 'components/Wallet/Dashboard/Collectibles/Collectible/Collectible'
import CollectiblesWrapper from 'components/Wallet/Dashboard/Collectibles/CollectiblesWrapper/CollectiblesWrapper'

import collectibles from './collectibles'

import styles from './CollectiblesPlaceholder.module.scss'

const CollectiblesPlaceholder = ({ isPrivateMode, collectiblesLength }) => (
    <CollectiblesWrapper 
        className={styles.blur}
        wrapperChildren={
            <div className={styles.placeholderOverlay}>
                <div className={styles.placeholderText}>
                    {(isPrivateMode && collectiblesLength) ? 'You can\'t see collectibles in private mode' : 'You don\'t have any collectibles (NFTs) yet' }
                </div>
            </div>
        }
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

export default CollectiblesPlaceholder