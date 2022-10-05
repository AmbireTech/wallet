import styles from './BalanceItem.module.scss'

const BalanceItem = ({ onClick, icon, name, value, decimalValue, children }) => (
  <div className={styles.balanceContainer}>
      <div className={styles.otherBalance} onClick={onClick}>
          <label className={styles.network}>
              { icon }
              <div className={styles.name}>
                { name }
              </div>
          </label>
          <label>
              <span className={styles.purpleHighlight}>
                $
              </span>
              { value }
              .{ decimalValue }
          </label>
      </div>
    { children }
  </div>
)

export default BalanceItem