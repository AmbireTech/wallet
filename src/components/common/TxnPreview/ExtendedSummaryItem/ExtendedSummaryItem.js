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
        (assetsItem) =>
          i.address === item.address &&
          (!item.symbol || assetsItem.symbol.toLowerCase() === item.symbol.toLowerCase())
      )
    return (
      <div className={styles.token}>
        {item.amount > 0 ? (
          <span>{formatFloatTokenAmount(item.amount, true, item.decimals)}</span>
        ) : null}
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
        ) : null}
        {!(item.decimals !== null && item.symbol) && item.amount > 0
          ? 'units of unknown token'
          : null}
      </div>
    )
  }

  if (item.type === 'address') {
    const shortenedAddress = `${item.address.substring(0, 8)}...${item.address.substring(
      item.address.length - 3,
      item.address.length
    )}`

    return (
      <a
        className={styles.address}
        href={item.address ? `${networkDetails.explorerUrl}/address/${item.address}` : null}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        <ToolTip disabled={!item.address} label={item.address}>
          <span className={styles.toAddress}>{item.name ? item.name : item.address}</span>
          <span className={cn(styles.toAddress, styles.short)}>
            {item.name ? item.name : null}
            {!item.name && item.address.length > 14 ? shortenedAddress : item.address}
          </span>
          {item.address ? <ExternalLinkIcon className={styles.externalLink} /> : null}
        </ToolTip>
      </a>
    )
  }

  if (item.type === 'network')
    return (
      <div className={styles.network}>
        {item.icon ? <img className={styles.icon} alt="" src={item.icon} /> : null}
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
        <span className={styles.toAddress}>{item.name}</span>
        <span className={cn(styles.toAddress, styles.short)}>
          {`${item.name.substring(0, 5)}...${item.name.substring(
            item.name.length - 5,
            item.name.length
          )}`}
        </span>
        {canShowLink ? <ExternalLinkIcon /> : null}
      </a>
    )
  }

  return null
}

export default ExtendedSummaryItem
