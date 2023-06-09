import cn from 'classnames'
import { formatUnits } from 'ethers/lib/utils'

import { getTokenIcon } from 'lib/icons'

import { ReactComponent as GasTankIcon } from 'resources/icons/gas-tank.svg'
import { ReactComponent as ExternalLinkIcon } from 'resources/icons/external-link.svg'

import styles from './Item.module.scss'

const toLocaleDateTime = (date) =>
  `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { timeStyle: 'short' })}`

const Item = ({ tokenDetails, item, network }) => (
  <div className={styles.wrapper}>
    <div className={styles.iconAndDate}>
      <div className={styles.gasTank}>
        <GasTankIcon className={cn(styles.icon)} />
      </div>
      <p className={styles.date}>
        {item.submittedAt && toLocaleDateTime(new Date(item.submittedAt)).toString()}
      </p>
    </div>
    <div className={styles.balanceAndLink}>
      <p className={styles.balance}>
        {tokenDetails && (
          <>
            <div className={styles.tokenIcon}>
              <img
                width="25px"
                height="25px"
                alt="logo"
                src={tokenDetails.icon || getTokenIcon(item.network, item.address)}
              />
            </div>

            <h4 className={styles.name}>{tokenDetails.symbol.toUpperCase()}</h4>
            {tokenDetails && formatUnits(item.value.toString(), tokenDetails.decimals).toString()}
          </>
        )}
      </p>
      <a
        href={`${network.explorerUrl}/tx/${item.txId}`}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        <ExternalLinkIcon className={styles.icon} />
      </a>
    </div>
  </div>
)

export default Item
