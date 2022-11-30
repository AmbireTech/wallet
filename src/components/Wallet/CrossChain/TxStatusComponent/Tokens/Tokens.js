import cn from 'classnames'

import { ReactComponent as SwapIcon } from 'resources/icons/cross-chain.svg'

import styles from './Tokens.module.scss'

const Tokens = ({ fromTokenAmount, fromTokenIcon, fromTokenName, toTokenAmount, toTokenIcon, toTokenName }) => (
  <div className={styles.wrapper}>
    {/* From Token */}
    <div className={styles.token}>
      {fromTokenAmount ? <p className={styles.tokenText}>{fromTokenAmount}</p> : null}
      <div className={styles.tokenBody}>
        <div className={styles.iconWrapper}>
          <img className={styles.icon} alt="" src={fromTokenIcon} />
        </div>
        {fromTokenName ? <p className={styles.tokenText}>{fromTokenName}</p> : null}
      </div>
    </div>
    {/* Swap Icon  */}
    <SwapIcon className={styles.swapIcon} />
    {/* To Token */}
    <div className={cn(styles.token, styles.toToken)}>
      {toTokenAmount ? <p className={styles.tokenText}>{toTokenAmount}</p> : null}
      <div className={styles.tokenBody}>
        <div className={styles.iconWrapper}>
          <img className={styles.icon} alt="" src={toTokenIcon} />
        </div>
        {toTokenName ? <p className={styles.tokenText}>{toTokenName}</p> : null}
      </div>
    </div>
  </div>
)

export default Tokens
