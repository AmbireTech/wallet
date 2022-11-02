import cn from 'classnames'
import styles from './TokensWrapper.module.scss'

const TokensWrapper = ({ children, titleSpacedLeft, tokenLabelChildren, className }) => (
  <div className={cn(styles.wrapper, className)}>
    <div className={cn(styles.title, { [styles.titleSpacedLeft]: titleSpacedLeft})}>
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

export default TokensWrapper