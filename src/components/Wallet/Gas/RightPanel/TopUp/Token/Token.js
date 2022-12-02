import { NavLink } from 'react-router-dom'
import { useState } from 'react'

import { getTokenIcon } from 'lib/icons'
import { formatFloatTokenAmount } from 'lib/formatters'

import { Button } from 'components/common'

import { GiToken } from 'react-icons/gi'

import styles from './Token.module.scss'

const Token = ({
  index,
  img,
  symbol,
  balance,
  balanceUSD,
  address,
  network,
}) => {
  const [failedImg, setFailedImg] = useState([])

  const logo = failedImg.includes(img) ? getTokenIcon(network, address) : img

  return (
    <div
      className={styles.wrapper}
      disabled={balance === 0}
    >
      <div className={styles.body}>
        <div className={styles.baseInfo}>
          <div className={styles.icon}>
            {failedImg.includes(logo) ? (
              <GiToken size={20} />
            ) : (
              <img src={logo} alt="" onError={() => setFailedImg((failed) => [...failed, logo])} />
            )}
          </div>
          <h4 className={styles.name}>{symbol.toUpperCase()}</h4>
        </div>
        <div className={styles.balance}>
          <p className={styles.currency}>{formatFloatTokenAmount(balance, true, 4)}</p>
          <p className={styles.dollar}>${balanceUSD.toFixed(2)}</p>
        </div>
      </div>
      <div className={styles.actions}>
        <NavLink
          to={{
            pathname: `/wallet/transfer/${address}`,
            state: {
              gasTankMsg: 'Warning: You are about to top up your Gas Tank. Top ups to the Gas Tank are non-refundable.',
              isTopUp: true,
            },
          }}
        >
          <Button className={styles.buttonComponent} small>
            Top up
          </Button>
        </NavLink>
      </div>
    </div>
  )
}

export default Token
