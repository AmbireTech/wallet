import cn from 'classnames'
import styles from './Pending.module.scss'
import { formatFloatTokenAmount } from 'lib/formatters'

const Pending = ({ hidePrivateValue, balance, decimals, pending, unconfirmed, extraMargin }) => {
  return (unconfirmed || pending) ? (
    <div className={cn(styles.wrapper, { [styles.extraMargin]: extraMargin })}>
      <div className={styles.ovals}>
        {pending ? <p className={styles.oval}>
          { hidePrivateValue(pending.balanceIncrease ? `+${Math.abs(pending.difference).toFixed(5)}` : `-${Math.abs(pending.difference).toFixed(5)}`) }
          {' '}
          Pending
        </p> : null}
        {unconfirmed ? <p className={styles.oval}>
          { hidePrivateValue(unconfirmed.balanceIncrease ? `+${Math.abs(unconfirmed.difference).toFixed(5)}` : `-${Math.abs(unconfirmed.difference).toFixed(5)}`) }
          {' '}
          Unsigned
        </p> : null}
      </div>
      <h3 className={styles.estimated}>
        <span>
          { hidePrivateValue(formatFloatTokenAmount(Number(balance).toFixed((balance < 1) ? 8 : 4), true, decimals))  }
        </span>
        {' '}
        Estimated balance
      </h3>
    </div>
  ) : null
}

export default Pending