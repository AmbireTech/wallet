import cn from 'classnames'
import styles from './Pending.module.scss'
import { formatFloatTokenAmount } from 'lib/formatters'

const Pending = ({ hidePrivateValue, decimals, pending, unconfirmed, latest, extraMargin }) => {
  return (unconfirmed || pending) ? (
    <div className={cn(styles.wrapper, { [styles.extraMargin]: extraMargin })}>
      <div className={styles.ovals}>
        {pending ? <p className={styles.oval}>
          { hidePrivateValue(pending.balanceIncrease ? `+${Math.abs(pending.difference).toFixed(5)}` : `-${Math.abs(pending.difference).toFixed(5)}`) }
          {' '}
          Pending transaction confirmation
        </p> : null}
        {unconfirmed ? <p className={styles.oval}>
          { hidePrivateValue(unconfirmed.balanceIncrease ? `+${Math.abs(unconfirmed.difference).toFixed(5)}` : `-${Math.abs(unconfirmed.difference).toFixed(5)}`) }
          {' '}
          Pending transaction signature
        </p> : null}
      </div>
      <h3 className={styles.estimated}>
          <span>
          { hidePrivateValue(formatFloatTokenAmount(latest?.balance ? Number(latest?.balance).toFixed((latest?.balance < 1) ? 8 : 4) : 0, true, decimals))  }
        </span>
        {' '}
        On-chain
      </h3>
    </div>
  ) : null
}

export default Pending