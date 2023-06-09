import { Modal } from 'components/common'
import { getTokenIcon } from 'lib/icons'
import { formatFloatTokenAmount } from 'lib/formatters'

import { useMemo } from 'react'
import styles from './GasTankBalanceByTokensModal.module.scss'

const GasTankBalanceByTokensModal = ({ data }) => {
  const sortedData = useMemo(() => {
    if (!data?.length) return []

    return data.sort((a, b) => b.balance - a.balance)
  }, [data])

  return (
    <Modal
      size="sm"
      className={styles.wrapper}
      contentClassName={styles.content}
      title="Gas Tank Balance by Tokens"
    >
      {sortedData.map((item, key) => {
        return (
          <div className={styles.token} key={key}>
            <div className={styles.iconAndName}>
              <div className={styles.icon}>
                <img alt="" src={item.icon || getTokenIcon(item.network, item.address)} />
              </div>
              <p className={styles.name}>{item.symbol.toUpperCase()}</p>
            </div>
            <div className={styles.amountAndValue}>
              <p className={styles.amount}>{formatFloatTokenAmount(item.balance, true, 6)}</p>
              <p className={styles.value}>${formatFloatTokenAmount(item.balanceInUSD, true, 6)}</p>
            </div>
          </div>
        )
      })}
    </Modal>
  )
}

export default GasTankBalanceByTokensModal
