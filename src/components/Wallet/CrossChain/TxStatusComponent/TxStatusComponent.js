import cn from 'classnames'

import { ReactComponent as SwapIcon } from 'resources/icons/cross-chain.svg'

import styles from './TxStatusComponent.module.scss'

const TxStatusComponent = ({
  children,
  fromNetworkIcon,
  fromNetworkName,
  toNetworkIcon,
  toNetworkName,
  fromTokenName,
  fromTokenAmount,
  fromTokenIcon,
  toTokenName,
  toTokenAmount,
  toTokenIcon,
  className,
}) => {
  return (
    <div className={cn(styles.wrapper, className)}>
      <div className={styles.summary}>
        <div className={styles.networks}>
          {/* From Network */}
          <div className={styles.network}>
            <div className={styles.iconWrapper}>
              <img src={fromNetworkIcon} alt="" className={styles.icon} />
            </div>
            <div className={styles.networkName}>
              <p>From</p>
              <h4 className={styles.name}>{fromNetworkName}</h4>
            </div>
          </div>
          {/* To Network */}
          <div className={cn(styles.network, styles.toNetwork)}>
            <div className={styles.iconWrapper}>
              <img src={toNetworkIcon} alt="" className={styles.icon} />
            </div>
            <div className={styles.networkName}>
              <p>To</p>
              <h4 className={styles.name}>{toNetworkName}</h4>
            </div>
          </div>
        </div>
        <div className={styles.tokens}>
          {/* From Token */}
          <div className={styles.token}>
            {fromTokenName ? <p className={styles.amount}>{fromTokenName}</p> : null}
            <div className={styles.iconWrapper}>
              <img className={styles.icon} alt="" src={fromTokenIcon} />
            </div>
            {fromTokenAmount ? <p className={styles.amount}>{fromTokenAmount}</p> : null}
          </div>
          {/* Swap Icon  */}
          <SwapIcon className={styles.swapIcon} />
          {/* To Token */}
          <div className={cn(styles.token, styles.toToken)}>
            {toTokenAmount ? <p className={styles.amount}>{toTokenAmount}</p> : null}
            <div className={styles.iconWrapper}>
              <img className={styles.icon} alt="" src={toTokenIcon} />
            </div>
            {toTokenName ? <p className={styles.amount}>{toTokenName}</p> : null}
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}

export default TxStatusComponent
