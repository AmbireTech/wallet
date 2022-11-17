import Item from './Item/Item'

import { ReactComponent as AlertIcon } from 'resources/icons/alert.svg'

import styles from './History.module.scss'

const History = ({ network, gasTankFilledTxns, feeAssetsRes }) => {
  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Gas Tank top up history</h2>
      <div className={styles.itemsWrapper}>
        <div className={styles.items}>
          {gasTankFilledTxns && gasTankFilledTxns.length ? (
            gasTankFilledTxns
              .map((item, key) => {
                const tokenDetails =
                  feeAssetsRes && feeAssetsRes.length
                    ? feeAssetsRes.find(
                        ({ address, network }) =>
                          address.toLowerCase() === item.address.toLowerCase() && network === item.network
                      )
                    : null
                if (!tokenDetails) return null // txn to gas Tank with not eligible token
                return <Item key={key} tokenDetails={tokenDetails} item={item} network={network} />
              })
              .filter((r) => r)
          ) : (
            <p className={styles.emptyMessage}>No top ups were made to Gas Tank on {network.id.toUpperCase()}</p>
          )}
        </div>
      </div>
      <div className={styles.warning}>
        <AlertIcon className={styles.warningIcon} />
        <p className={styles.warningText}>
          <span>Warning:</span> It will take some time to top up the Gas Tank after the transaction is signed.
        </p>
      </div>
    </div>
  )
}

export default History
