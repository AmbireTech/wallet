import cn from 'classnames'

import { formatAmount } from 'components/Wallet/CrossChain/CrossChain'

import { ReactComponent as SwapIcon } from 'resources/icons/cross-chain.svg'
import Footer from './Footer/Footer'
import Separator from './Separator/Separator'

import styles from './Route.module.scss'

const Route = ({
  data: {
    bridgeStep,
    middlewareStep,
    middlewareFee,
    bridgeFee,
    maxServiceTime,
    serviceTime,
    fromAsset,
    toAsset
  }
}) => (
  <div className={styles.wrapper}>
    <div className={styles.body}>
      <div className={styles.iconWrapper}>
        <img className={styles.icon} src={fromAsset.icon} alt="" />
        <p className={styles.fromAmount}>
          {middlewareStep
            ? formatAmount(middlewareStep.fromAmount, middlewareStep.fromAsset)
            : formatAmount(bridgeStep.fromAmount, bridgeStep.fromAsset)}
        </p>
      </div>
      <Separator />
      {middlewareStep ? (
        <div className={styles.middlewareWrapper}>
          <div className={styles.stepItem}>
            <img className={styles.stepItemIcon} src={middlewareStep.protocol.icon} alt="" />
            <h4 className={styles.stepItemName}>{middlewareStep.protocol.displayName}</h4>
          </div>
          <img className={styles.middlewareAssetIcon} src={middlewareStep.fromAsset.icon} alt="" />
          <img className={styles.middlewareAssetIcon} src={middlewareStep.toAsset.icon} alt="" />
        </div>
      ) : null}
      {middlewareStep ? <Separator /> : null}
      <div className={cn(styles.iconWrapper, styles.swapIconWrapper)}>
        <SwapIcon className={styles.swapIcon} />
        <div className={styles.stepItem}>
          <img className={styles.stepItemIcon} src={bridgeStep.protocol.icon} alt="" />
          <h4 className={styles.stepItemName}>{bridgeStep.protocol.displayName}</h4>
        </div>
      </div>
      <Separator />
      <div className={styles.iconWrapper}>
        <img src={toAsset.icon} alt="" className={styles.icon} />
        <p className={styles.toAmount}>{formatAmount(bridgeStep.toAmount, bridgeStep.toAsset)}</p>
      </div>
    </div>
    <Footer
      fee={bridgeFee + middlewareFee}
      feeSymbol={toAsset.symbol}
      serviceTime={serviceTime}
      maxServiceTime={maxServiceTime}
    />
  </div>
)

export default Route
