import { NavLink } from 'react-router-dom'

import styles from './Collectible.module.scss'

const Collectible = ({
  href,
  collectionIcon,
  collectionName,
  image,
  name,
  price
}) => {

  return (
    <div className={styles.wrapper}>
      <NavLink to={href}>
        <img className={styles.artwork} src={image} alt="" />
        <div className={styles.info}>
          <div className={styles.collection}>
            <img src={collectionIcon} alt="" className={styles.collectionIcon} />
            <h2 className={styles.collectionName}>{ collectionName }</h2>
          </div>
          <div className={styles.details}>
            <h3 className={styles.name}>{ name }</h3>
            <p className={styles.value}>
              <span className={styles.purpleHighlight}>$</span>{price}
            </p>
          </div>
        </div>
      </NavLink>
    </div>
  )
}

export default Collectible