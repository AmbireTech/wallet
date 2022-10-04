import styles from './BalanceItem.module.scss'

const BalanceItem = ({ onClick, icon, name, value, decimalValue, children }) => (
  <div className={styles.balanceContainer}>
      <div className={styles.otherBalance} onClick={onClick}>
          <label>
              <span className={styles.purpleHighlight}>
                $
              </span>
              { value }
              .{ decimalValue }
          </label>
          <label className={styles.network}>
              on
              { icon }
              <div className={styles.name}>
                { name }
              </div>
          </label>
      </div>
    { children }
  </div>
)

export default BalanceItem