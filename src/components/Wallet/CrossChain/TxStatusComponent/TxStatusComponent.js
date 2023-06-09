import cn from 'classnames'

import Networks from './Networks/Networks'
import Tokens from './Tokens/Tokens'

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
  className
}) => {
  return (
    <div className={cn(styles.wrapper, className)}>
      <div className={styles.body}>
        <Networks
          fromNetworkIcon={fromNetworkIcon}
          fromNetworkName={fromNetworkName}
          toNetworkIcon={toNetworkIcon}
          toNetworkName={toNetworkName}
        />
        <Tokens
          fromTokenName={fromTokenName}
          fromTokenAmount={fromTokenAmount}
          fromTokenIcon={fromTokenIcon}
          toTokenName={toTokenName}
          toTokenAmount={toTokenAmount}
          toTokenIcon={toTokenIcon}
        />
      </div>
      {children}
    </div>
  )
}

export default TxStatusComponent
