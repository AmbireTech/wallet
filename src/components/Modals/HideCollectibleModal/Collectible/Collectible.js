import styles from './Collectible.module.scss'

const Collectible = ({ button, asset}) =>{
  return (
  <div className={styles.wrapper}>
    <div className={styles.info}>
      <div className={styles.iconWrapper}>
        <img src={asset.data.imageUrl} alt="" className={styles.icon} />
      </div>
      <h3 className={styles.name}>{asset.name}</h3>
    </div>
    {button}
  </div>
)}

export default Collectible
