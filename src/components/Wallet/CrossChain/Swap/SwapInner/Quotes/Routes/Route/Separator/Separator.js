import styles from './Separator.module.scss'

const Separator = () => (
  <div className={styles.wrapper}>
    <div className={styles.circle} />
    <div className={styles.line} />
    <div className={styles.circle} />
  </div>
)

export default Separator
