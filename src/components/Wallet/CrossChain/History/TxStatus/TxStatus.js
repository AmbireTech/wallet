import cn from 'classnames'

import { formatAmount } from 'components/Wallet/CrossChain/CrossChain'

import { Loading } from 'components/common'
import TxStatusComponent from 'components/Wallet/CrossChain/TxStatusComponent/TxStatusComponent'

import { MdOutlineCheck, MdOutlineClose } from 'react-icons/md'
import { ReactComponent as ExternalLinkIcon } from 'resources/icons/external-link.svg'

import styles from './TxStatus.module.scss'

const TxStatus = ({
  data: {
    sourceTx,
    fromNetwork,
    toNetwork,
    toAsset,
    toAmount,
    from,
    to,
    serviceTimeMinutes,
    isPending,
    statusError
  }
}) => {
  return (
    <TxStatusComponent
      fromNetworkIcon={fromNetwork.icon}
      fromNetworkName={fromNetwork.name}
      toNetworkIcon={toNetwork.icon}
      toNetworkName={toNetwork.name}
      fromTokenName={from?.asset?.symbol}
      fromTokenAmount={from.amount ? formatAmount(from.amount, from.asset) : ''}
      fromTokenIcon={from?.asset?.icon}
      toTokenName={to?.asset?.symbol}
      toTokenAmount={
        to.amount
          ? formatAmount(to.amount, to.asset)
          : toAsset && toAmount
          ? formatAmount(parseFloat(toAmount), toAsset)
          : ''
      }
      toTokenIcon={to?.asset?.icon}
    >
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
    </TxStatusComponent>
  )
}

export default TxStatus
