import Item from './Item/Item'

import styles from './History.module.scss'

const History = ({ network, gasTankFilledTxns, feeAssetsRes }) => {
  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Gas Tank top up history</h2>
      <div className={styles.itemsWrapper}>
        {gasTankFilledTxns && gasTankFilledTxns.length ? (
          <div className={styles.items}>
            {gasTankFilledTxns
              .map((item, key) => {
                const tokenDetails =
                  feeAssetsRes && feeAssetsRes.length
                    ? feeAssetsRes.find(
                        ({ address, network }) =>
                          address.toLowerCase() === item.address.toLowerCase() &&
                          network === item.network
                      )
                    : null
                if (!tokenDetails) return null // txn to gas Tank with not eligible token
                return <Item key={key} tokenDetails={tokenDetails} item={item} network={network} />
              })
              .filter((r) => r)}
          </div>
        ) : (
          <p className={styles.emptyMessage}>No top ups were made to Gas Tank on {network.name}</p>
        )}
      </div>
    </div>
  )
}

export default History
