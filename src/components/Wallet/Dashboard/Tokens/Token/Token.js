import { NavLink } from 'react-router-dom'

import { getTokenIcon } from 'lib/icons'

import { Image } from 'components/common'

import { ReactComponent as SendIcon } from 'resources/icons/send.svg'
// import { ReactComponent as EarnIcon } from 'resources/icons/earn.svg'
// import { ReactComponent as SwapIcon } from 'resources/icons/swap-2.svg'

import styles from './Token.module.scss'

const Token = ({
  img, 
  symbol, 
  balance,
  price,
  address, 
  network, 
  value,
  unconfirmed,
  pending,
  // Children
  bodyChildren,
  wrapperEndChildren,
  // Actions
  sendUrl,
  ...props
}) => {

  return (
    <div
      className={styles.wrapper}
      {...props}
    >
      <div className={styles.body}>
        {bodyChildren}
        <div className={styles.infoAndActions}>
          <div className={styles.baseInfo}>
            <div className={styles.iconWrapper}>
              <Image 
                src={img || getTokenIcon(network, address)}
                alt=""
                failedClassName={styles.iconFailed}
              />
            </div>
            <div className={styles.balanceAndSymbol}>
              <h3 className={styles.symbol}>{ symbol }</h3>
              <p className={`${styles.balance} ${(unconfirmed || pending  ? styles.balanceEstimated : '')}`}>
                { balance }
              </p>
            </div>
          </div>
          <div className={styles.priceAndValue}>
            <h3 className={styles.price}>
              { price }
            </h3>
            <h3 className={`${styles.value} ${(unconfirmed || pending  ? styles.valueEstimated : '')}`}>
              <span className={styles.symbol}>$</span>
              { value }
            </h3>
          </div>
        </div>
        <div className={styles.actions}>
          <NavLink to={sendUrl || '/wallet'} className={styles.action}>
            <SendIcon />
            <p>
              Send
            </p>
          </NavLink>
          {/* <div className={styles.action}>
            <EarnIcon />
          </div>
          <div className={styles.action}>
            <SwapIcon />
          </div> */}
        </div>
      </div>
      {wrapperEndChildren}
    </div>
  )
}

export default Token