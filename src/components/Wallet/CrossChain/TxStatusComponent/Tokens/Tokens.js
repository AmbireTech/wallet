import cn from 'classnames'

import { ReactComponent as SwapIcon } from 'resources/icons/cross-chain.svg'

import { ToolTip } from 'components/common'

import styles from './Tokens.module.scss'

const Tokens = ({ fromTokenAmount, fromTokenIcon, fromTokenName, toTokenAmount, toTokenIcon, toTokenName }) => (
  <div className={styles.wrapper}>
    {/* From Token */}
    <div className={styles.token}>
      {fromTokenAmount ? (
        <ToolTip label={fromTokenAmount}>
          <p className={styles.tokenText}>{fromTokenAmount}</p>
        </ToolTip>
      ) : null}
      <div className={styles.tokenBody}>
        <div className={styles.iconWrapper}>
          <img className={styles.icon} alt="" src={fromTokenIcon} />
        </div>
        {fromTokenName ? <p className={styles.tokenText}>{fromTokenName}</p> : null}
      </div>
    </div>
    <SwapIcon className={styles.swapIcon} />
    {/* To Token */}
    <div className={cn(styles.token, styles.toToken)}>
      {toTokenAmount ? (
        <ToolTip label={toTokenAmount}>
          <p className={styles.tokenText}>{toTokenAmount}</p>
        </ToolTip>
      ) : null}
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
