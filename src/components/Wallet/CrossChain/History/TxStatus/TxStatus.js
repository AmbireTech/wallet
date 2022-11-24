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
        <div className={styles.networks}>
          {/* From Network */}
          <div className={styles.network}>
            <div className={styles.iconWrapper}>
              <img src={fromNetwork.icon} alt="" className={styles.icon} />
            </div>
            <div className={styles.networkName}>
              <p>From</p>
              <h4 className={styles.name}>{fromNetwork.name}</h4>
            </div>
          </div>
          {/* To Network */}
          <div className={cn(styles.network, styles.toNetwork)}>
            <div className={styles.iconWrapper}>
              <img src={toNetwork.icon} alt="" className={styles.icon} />
            </div>
            <div className={styles.networkName}>
              <p>To</p>
              <h4 className={styles.name}>{toNetwork.name}</h4>
            </div>
          </div>
        </div>
        <div className={styles.tokens}>
          {/* From Token */}
          <div className={styles.token}>
            <p className={styles.amount}>
              {from.amount ? formatAmount(from.amount, from.asset) : ''}
            </p>
            <div className={styles.iconWrapper}>
              <img className={styles.icon} alt="" src={from?.asset?.icon} />
            </div>
            <p className={styles.amount}>{from?.asset?.symbol}</p>
          </div>
          {/* Swap Icon  */}
          <SwapIcon className={styles.swapIcon} />
          {/* To Token */}
          <div className={cn(styles.token, styles.toToken)}>
            <p className={styles.amount}>
            {to.amount ? formatAmount(to.amount, to.asset) : ''}
            {toAsset && toAmount ? formatAmount(parseFloat(toAmount), toAsset) : ''}
            </p>
            <div className={styles.iconWrapper}>
              <img className={styles.icon} alt="" src={to?.asset?.icon} />
            </div>
            <p className={styles.amount}>{to?.asset?.symbol}</p>
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
