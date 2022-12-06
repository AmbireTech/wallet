
import { useMemo } from 'react'

import {
  MdVisibilityOff as VisibleIcon,
  MdRemoveRedEye as HiddenIcon
} from 'react-icons/md'

import styles from './HideCollectible.module.scss'

const Collectible = ({ button, handleUri, asset }) => (
  <div className={styles.collectible}>
    <div className={styles.info}>
      <div className={styles.iconWrapper}>
        <img src={handleUri(asset.data.image)} alt="" className={styles.icon} />
      </div>
      <h3 className={styles.name}>
        { asset.data.name }
      </h3>
    </div>
    { button }
  </div>
)

const HideCollectible = ({ portfolio, handleUri }) => {
  const { hiddenCollectibles, onAddHiddenCollectible, onRemoveHiddenCollectible, collectibles } = portfolio

  const hideCollectible = (collectible, assetId) => onAddHiddenCollectible(collectible, assetId)

  const unhideCollectible = (collectible, assetId) => onRemoveHiddenCollectible(collectible.address, assetId)

  const sortedCollectibles = useMemo(() => {
    const tempCollectibles = collectibles.concat(hiddenCollectibles)
    return [...new Map(tempCollectibles.map(collectible => [collectible.address, collectible])).values()]
  }, [collectibles, hiddenCollectibles])

  return (
    <div className={styles.collectibles}>
      {sortedCollectibles.map((collectible) => (collectible.assets || []).map((asset) => (
        <Collectible
          key={collectible.address}
          asset={asset}
          button={!asset.isHidden ? 
            <HiddenIcon className={styles.icon} color="#27e8a7" onClick={() => hideCollectible(collectible, asset.tokenId)} /> :
            <VisibleIcon className={styles.icon} color="#F21A61" onClick={() => unhideCollectible(collectible, asset.tokenId)} />
          }
          handleUri={handleUri}
        />
      )))}
    </div>
  )
}

export default HideCollectible
