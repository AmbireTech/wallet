import cn from 'classnames'
import styles from './Token.module.scss'

const Token = ({ name, network, icon, className, children }) => (
  <div className={cn(styles.wrapper, className)}>
    <div className={styles.info}>
      <div className={styles.iconWrapper}>
        <img src={icon} alt="" className={styles.icon} />
      </div>
      <h3 className={styles.name}>
        { name }
        {' '}
        <span>
          ({ network })
        </span>
      </h3>
    </div>
    { children }
  </div>
)

export default Token