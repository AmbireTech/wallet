import { Image } from 'components/common'
import { NavLink } from 'react-router-dom'

import FallbackImage from 'resources/icons/fallback.svg'

import styles from './Collectible.module.scss'

const Collectible = ({ href, collectionIcon, collectionName, image, name, price }) => (
  <NavLink to={href}>
    <div className={styles.wrapper}>
      <Image
        alt=""
        src={image}
        className={styles.artworkWrapper}
        imageClassName={styles.artwork}
        failedClassName={styles.fallbackImage}
        fallbackImage={FallbackImage}
        size="auto"
      />

      <div className={styles.info}>
        <div className={styles.collection}>
          <Image
            alt=""
            src={collectionIcon}
            imageClassName={styles.collectionIcon}
            failedClassName={styles.fallbackImage}
            fallbackImage={FallbackImage}
            size={18}
          />
          <h2 className={styles.collectionName}>{collectionName}</h2>
        </div>
        <div className={styles.details}>
          <h3 className={styles.name}>{name}</h3>
          <p className={styles.value}>
            <span className={styles.purpleHighlight}>$</span>
            {price}
          </p>
        </div>
      </div>
    </div>
  </NavLink>
)

export default Collectible
