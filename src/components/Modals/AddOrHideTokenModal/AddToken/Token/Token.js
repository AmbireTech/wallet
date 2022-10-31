import cn from 'classnames'
import styles from './Token.module.scss'

const Token = ({ name, symbol, icon, className, children }) => (
  <div className={cn(styles.wrapper, className)}>
    <div className={styles.info}>
      <img src={icon} alt="" className={styles.icon} />
      <div className={styles.name}>
        { name }
        {' '}
        <span>
          { symbol }
        </span>
      </div>
    </div>
    { children }
  </div>
)

export default Token