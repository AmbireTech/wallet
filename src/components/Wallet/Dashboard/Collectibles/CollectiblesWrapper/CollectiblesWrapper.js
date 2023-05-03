import cn from 'classnames'
import styles from './CollectiblesWrapper.module.scss'

const CollectiblesWrapper = ({ wrapperChildren, children, wrapperEndChildren, className }) => (
  <div className={styles.wrapper}>
    <div className={styles.relative}>
      {wrapperChildren}
      <div className={cn(styles.collectiblesWrapper, className)}>{children}</div>
    </div>
    {wrapperEndChildren}
  </div>
)

export default CollectiblesWrapper
