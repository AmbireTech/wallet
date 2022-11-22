import cn from 'classnames'

import styles from './Route.module.scss'

const formatAmount = (amount, asset) => amount / Math.pow(10, asset.decimals)

const Route = ({ data: { bridgeStep, bridgeFee, maxServiceTime, serviceTime, middlewareRoute, middlewareFee } }) => (
  <div className={styles.wrapper}>
    <div className={styles.info}>
      {middlewareRoute ? (
        <div className={styles.middleware}>
          <div className={styles.icon} style={{ backgroundImage: `url(${middlewareRoute.protocol.icon})` }}></div>
          <div className={styles.name}>{middlewareRoute.protocol.displayName}</div>
        </div>
      ) : null}
      <div className={styles.bridge}>
        <div className={styles.icon} style={{ backgroundImage: `url(${bridgeStep.protocol.icon})` }}></div>
        <div className={styles.name}>{bridgeStep.protocol.displayName}</div>
      </div>
    </div>
    <div className={styles.summary}>
      <div className={styles.amounts}>
        {middlewareRoute ? (
          <div className={cn(styles.amount, styles.middleware)}>
            {formatAmount(middlewareRoute.fromAmount, middlewareRoute.fromAsset)} {middlewareRoute.fromAsset.symbol}
          </div>
        ) : null}
        <div className={cn(styles.amount, styles.bridge)}>
          {formatAmount(bridgeStep.toAmount, bridgeStep.toAsset)} {bridgeStep.toAsset.symbol}
        </div>
      </div>
      <div className={styles.fees}>
        {middlewareFee ? (
          <div className={cn(styles.fee, styles.middleware)}>
            {middlewareFee ? (
              <>
                Fee: {middlewareFee} {middlewareRoute?.protocolFees?.asset?.symbol}
              </>
            ) : null}
          </div>
        ) : null}
        {bridgeFee ? (
          <div className={cn(styles.fee, styles.bridge)}>
            {bridgeFee ? (
              <>
                Fee: {bridgeFee} {bridgeStep?.protocolFees?.asset?.symbol}
              </>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className={styles.time}>{`ETA ${serviceTime / 60} minutes`}</div>
      <div className={styles.time}>{`Max ETA ${maxServiceTime / 60} minutes`}</div>
    </div>
  </div>
)

export default Route
