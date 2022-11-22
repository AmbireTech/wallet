import cn from 'classnames'

import { Loading } from 'components/common'

import { MdOutlineCheck, MdOutlineClose } from 'react-icons/md'
import { ReactComponent as ExternalLinkIcon } from 'resources/icons/external-link.svg'
import { ReactComponent as SwapIcon } from 'resources/icons/cross-chain.svg'

import styles from './TxStatus.module.scss'

const formatAmount = (amount, asset) => amount / Math.pow(10, asset.decimals)

const TxStatus = ({
  data: { sourceTx, fromNetwork, toNetwork, toAsset, toAmount, from, to, serviceTimeMinutes, isPending, statusError },
}) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.summary}>
        <div className={styles.path}>
          <div className={styles.network}>
            <div className={styles.icon} style={{ backgroundImage: `url(${fromNetwork.icon})` }}></div>
            <div className={styles.name}>{fromNetwork.name}</div>
          </div>
          <div className={styles.amount}>
            {from.amount ? formatAmount(from.amount, from.asset) : ''}
            <div className={styles.asset}>
              <div className={styles.icon} style={{ backgroundImage: `url(${from?.asset?.icon})` }}></div>
              <div className={styles.name}>{from?.asset?.symbol}</div>
            </div>
          </div>
        </div>
        <SwapIcon className={styles.swapIcon} />
        <div className={styles.path}>
          <div className={styles.network}>
            <div className={styles.icon} style={{ backgroundImage: `url(${toNetwork.icon})` }}></div>
            <div className={styles.name}>{toNetwork.name}</div>
          </div>

          <div className={styles.amount}>
            {to.amount ? formatAmount(to.amount, to.asset) : ''}
            {toAsset && toAmount ? formatAmount(parseFloat(toAmount), toAsset) : ''}
            <div className={styles.asset}>
              <div className={styles.icon} style={{ backgroundImage: `url(${to?.asset?.icon})` }}></div>
              <div className={styles.name}>{to?.asset?.symbol}</div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.details}>
        <a
          className={styles.explorerLink}
          href={`${fromNetwork.explorerUrl}/tx/${sourceTx}`}
          target="_blank"
          rel="noreferrer"
        >
          View on Block Explorer <ExternalLinkIcon />
        </a>
        {statusError ? (
          <p className={cn(styles.status, styles.error)}>
            <MdOutlineClose />
            Could not fetch status
          </p>
        ) : isPending ? (
          <p className={cn(styles.status, styles.pending)}>
            <Loading className={styles.loading} />
            Pending
            <span>(Usually takes {serviceTimeMinutes || 20} minutes)</span>
          </p>
        ) : (
          <p className={cn(styles.status, styles.confirmed)}>
            <MdOutlineCheck />
            Confirmed
          </p>
        )}
      </div>
    </div>
  )
}

export default TxStatus
