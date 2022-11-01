import cn from 'classnames'
import styles from './CollectiblesWrapper.module.scss'

const CollectiblesWrapper = ({wrapperChildren, children, wrapperEndChildren, className}) => (
  <div className={styles.wrapper}>
    {wrapperChildren}
    <div className={cn(styles.collectiblesWrapper, className)}>
      {children}
    </div>
    {wrapperEndChildren} 
  </div>        
)

export default CollectiblesWrapper