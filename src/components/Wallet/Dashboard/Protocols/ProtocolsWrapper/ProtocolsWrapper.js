import cn from 'classnames'
import styles from './ProtocolsWrapper.module.scss'

const ProtocolsWrapper = ({ children, tokenLabelChildren, className }) => (
  <div className={cn(styles.category, className)} key="category-tokens">
    <div className={styles.title}>
      <div className={styles.token}>
        Token
        {tokenLabelChildren}
      </div>
      <h3 className={styles.price}>
        Price
      </h3>
      <h3 className={styles.value}>
        Value
      </h3>
      <div className={styles.actions}>
        Actions
      </div>
    </div>
    <div className={styles.list}>
      {children}
    </div>
</div>
)

export default ProtocolsWrapper