import cn from 'classnames'
import Footer from './Footer/Footer'

import { ReactComponent as SwapIcon } from 'resources/icons/cross-chain.svg'

import styles from './Route.module.scss'
import Separator from './Separator/Separator'

const formatAmount = (amount, asset) => (amount / Math.pow(10, asset.decimals))

const Route = ({
  data: { bridgeStep, middlewareRoute, middlewareFee, bridgeFee, maxServiceTime, serviceTime, fromAsset, toAsset },
}) => (
  <div className={styles.wrapper}>
    <div className={styles.body}>
      <div className={styles.iconWrapper}>
        <img className={styles.icon} src={fromAsset.icon} alt="" />
        <p className={styles.fromAmount}>
          {middlewareRoute
            ? formatAmount(middlewareRoute.fromAmount, middlewareRoute.fromAsset)
            : formatAmount(bridgeStep.fromAmount, bridgeStep.fromAsset)}
        </p>
      </div>
      <Separator />
      {middlewareRoute ? (
        <div className={styles.middlewareWrapper}>
          <div className={cn(styles.topItem, styles.middleware)}>
            <img className={styles.topItemIcon} src={middlewareRoute.protocol.icon} alt="" />
            <h4 className={styles.topItemName}>{middlewareRoute.protocol.displayName}</h4>
          </div>
          <img className={styles.middlewareAssetIcon} src={middlewareRoute.fromAsset.icon} alt="" />
          <img className={styles.middlewareAssetIcon} src={middlewareRoute.toAsset.icon} alt="" />
        </div>
      ) : null}
      {middlewareRoute ? <Separator /> : null}
      <div className={cn(styles.iconWrapper, styles.swapIconWrapper)}>
        <SwapIcon className={styles.swapIcon} />
        <div className={styles.topItem}>
          <img className={styles.topItemIcon} src={bridgeStep.protocol.icon} alt="" />
          <h4 className={styles.topItemName}>{bridgeStep.protocol.displayName}</h4>
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
