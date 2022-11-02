import { NavLink } from 'react-router-dom'

import FallbackImage from './images/fallback.svg'

import styles from './Collectible.module.scss'

const Collectible = ({
  href,
  collectionIcon,
  collectionName,
  image,
  name,
  price
}) => (
  <NavLink to={href}>
    <div className={styles.wrapper}>
        <img 
          className={styles.artwork} 
          src={image} 
          alt="" 
          onError={({ currentTarget }) => {
            currentTarget.onerror = null // prevents looping
            currentTarget.src=FallbackImage
            currentTarget.classList.add(styles.fallbackImage)
          }} 
        />
        <div className={styles.info}>
          <div className={styles.collection}>
            <img 
              src={collectionIcon} 
              alt="" 
              className={styles.collectionIcon} 
              onError={({ currentTarget }) => {
                currentTarget.onerror = null // prevents looping
                currentTarget.src=FallbackImage
                currentTarget.classList.add(styles.fallbackImage)
              }} 
            />
            <h2 className={styles.collectionName}>{ collectionName }</h2>
          </div>
          <div className={styles.details}>
            <h3 className={styles.name}>{ name }</h3>
            <p className={styles.value}>
              <span className={styles.purpleHighlight}>$</span>{price}
            </p>
          </div>
        </div>
    </div>
  </NavLink>
)

export default Collectible