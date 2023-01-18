import cn from 'classnames'

import { formatFloatTokenAmount } from 'lib/formatters'
import ToolTip from 'components/common/ToolTip/ToolTip'

import { ReactComponent as ExternalLinkIcon } from 'resources/icons/external-link.svg'
import { getTokenIcon } from 'lib/icons'

import styles from './ExtendedSummaryItem.module.scss'

const ExtendedSummaryItem = ({ item, i, networkDetails, feeAssets }) => {
  if (item.length === 1) return item

  if (i === 0) return <div className={cn(styles.action, styles[item.toLowerCase()])}>{item}</div>

  if (!item.type) return <div className={styles.word}>{item}</div>
  if (item.type === 'token') {
    const foundToken =
      feeAssets &&
      feeAssets.find(
        (i) => i.address === item.address && (!item.symbol || i.symbol.toLowerCase() === item.symbol.toLowerCase())
      )
    return (
      <div className={styles.token}>
        {item.amount > 0 ? <span>{formatFloatTokenAmount(item.amount, true, item.decimals)}</span> : null}
        {item.decimals !== null && item.symbol ? (
          <>
            {item.address ? (
              <img
                className={styles.icon}
                alt=""
                src={foundToken ? foundToken.icon : getTokenIcon(networkDetails.id, item.address)}
              />
            ) : null}
            {item.symbol}
          </>
        ) : (item.amount > 0) ? (
          'units of unknown token'
        ) : null}
      </div>
    )
  }

  if (item.type === 'address')
    return (
      <a
        className={styles.address}
        href={item.address ? `${networkDetails.explorerUrl}/address/${item.address}` : null}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        <ToolTip disabled={!item.address} label={item.address}>
          {item.name ? item.name : item.address}
          {item.address ? <ExternalLinkIcon className={styles.externalLink} /> : null}
        </ToolTip>
      </a>
    )

  if (item.type === 'network')
    return (
      <div className={styles.network}>
        {item.icon ? <img
          className={styles.icon}
          alt=""
          src={item.icon}
        /> : null}
        {item.name}
      </div>
    )

  if (item.type === 'erc721') {
    const canShowLink = item.network && item.address && item.id
    return (
      <a
        className={styles.erc721}
        href={canShowLink ? `#/wallet/nft/${item.network}/${item.address}/${item.id}` : null}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        {item.name}
        {canShowLink ? <ExternalLinkIcon /> : null}
      </a>
    )
  }

  return null
}

export default ExtendedSummaryItem
