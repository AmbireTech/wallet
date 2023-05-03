import styles from './BalanceItem.module.scss'

const BalanceItem = ({ onClick, icon, name, value, decimalValue }) => (
  <div className={styles.balanceContainer} onClick={onClick}>
    <label className={styles.network}>
      {icon}
      <div className={styles.name}>{name}</div>
    </label>
    <label>
      <span className={styles.purpleHighlight}>$</span>
      {value}.{decimalValue}
    </label>
  </div>
)

export default BalanceItem
