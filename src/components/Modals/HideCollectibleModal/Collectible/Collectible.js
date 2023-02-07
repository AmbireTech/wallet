import styles from './Collectible.module.scss'

const Collectible = ({ button, handleUri, asset }) => (
  <div className={styles.wrapper}>
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

export default Collectible