import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { GiToken } from 'react-icons/gi'

import { getTokenIcon } from 'lib/icons'

import { ReactComponent as SendIcon } from 'resources/icons/send.svg'
import { ReactComponent as EarnIcon } from 'resources/icons/earn.svg'
import { ReactComponent as SwapIcon } from 'resources/icons/swap-2.svg'

import styles from './Token.module.scss'

const Token = ({
  img, 
  symbol, 
  balance,
  price,
  address, 
  network, 
  value,
  wrapperChildren,
  // Actions
  sendUrl,
  ...props
}) => {
  const [failedImg, setFailedImg] = useState([])
  const logo = failedImg.includes(img) || !img ? getTokenIcon(network, address) : img

  return (
    <div
      className={styles.wrapper}
      {...props}
    >
      {wrapperChildren}
      <div className={styles.body}>
        <div className={styles.baseInfo}>
          <div className={styles.iconWrapper}>
            { 
              failedImg.includes(logo) ? <GiToken size={20} /> : <img 
                src={logo} 
                draggable="false" 
                alt="Token Icon" 
                onError={() => setFailedImg(failed => [...failed, logo])}
                className={styles.icon}
              />
            }
          </div>
          <div className={styles.balanceAndSymbol}>
            <h3 className={styles.symbol}>{ symbol }</h3>
            <p className={styles.balance}>
              { balance }
            </p>
          </div>
        </div>
        <div className={styles.priceAndValue}>
          <h3 className={styles.price}>
            { price }
          </h3>
          <h3 className={styles.value}>
            <span className={styles.symbol}>$</span>
            { value }
          </h3>
        </div>
      </div>
      <div className={styles.actions}>
        <NavLink to={sendUrl || '/wallet'}>
          <div className={styles.action}>
            <SendIcon />
          </div>
        </NavLink>
        <div className={styles.action}>
          <EarnIcon />
        </div>
        <div className={styles.action}>
          <SwapIcon />
        </div>
      </div>
  </div>
  )
}

export default Token