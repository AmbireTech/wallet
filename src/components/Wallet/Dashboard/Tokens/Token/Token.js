import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { GiToken } from 'react-icons/gi'
import { MdDragIndicator } from 'react-icons/md'

import { getTokenIcon } from 'lib/icons'
import { formatFloatTokenAmount } from 'lib/formatters'

import { ReactComponent as SendIcon } from 'resources/icons/send.svg'
import { ReactComponent as EarnIcon } from 'resources/icons/earn.svg'
import { ReactComponent as SwapIcon } from 'resources/icons/swap-2.svg'

import styles from './Token.module.scss'

const Token = ({
  index, 
  img, 
  symbol, 
  balance,
  category,
  balanceUSD,
  price,
  address, 
  send = false, 
  network, 
  decimals, 
  sortedTokens,
  hidePrivateValue,
  sortType,
  isMobileScreen,
  dragAndDrop, 
  pending,
  unconfirmed, 
  latest
}) => {
  const [failedImg, setFailedImg] = useState([])
  const logo = failedImg.includes(img) || !img ? getTokenIcon(network, address) : img

  const latestBalance = latest ? latest.balance : ((!unconfirmed && !pending) ? balance : 0)

  const {
    dragStart,
    dragEnter,
    target,
    handle,
    dragTarget,
    drop
  } = dragAndDrop

  return (
    <div className={styles.wrapper}
      draggable={category === 'tokens' && sortedTokens.length > 1 && sortType === 'custom' && !isMobileScreen}
      onDragStart={(e) => { 
        if (handle.current === target.current || handle.current.contains(target.current)) dragStart(e, index)
        else e.preventDefault();
      }}
      onMouseDown={(e) => dragTarget(e, index)}
      onDragEnter={(e) => dragEnter(e, index)}
      onDragEnd={() => drop(sortedTokens)}
      onDragOver={(e) => e.preventDefault()}
    >
      {sortedTokens.length > 1 && sortType === 'custom' && !isMobileScreen && <MdDragIndicator size={20} className={styles.dragHandle} onClick={(e) => dragStart(e, index)} id={`${index}-handle`} />}
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
              { hidePrivateValue(formatFloatTokenAmount(balance, true, decimals)) }
            </p>
          </div>
        </div>
        <div className={styles.priceAndValue}>
          <h3 className={styles.price}>
            {/* latest ? latest.balanceUSD : balanceUSD */}
            ${price ? hidePrivateValue((price).toFixed((price < 1) ? 5 : 2)) : '-'}
          </h3>
          <h3 className={styles.value}>
            <span className={styles.symbol}>$</span>
            { hidePrivateValue(formatFloatTokenAmount(latestBalance, true, decimals)) }
          </h3>
        </div>
      </div>

      {unconfirmed && <span className={styles.balanceAwaiting}> awaiting signature { hidePrivateValue(formatFloatTokenAmount(unconfirmed.balance, true, decimals)) } </span> }
      {pending && <span className={styles.balancePending}> pending { hidePrivateValue(pending.balance.toFixed(2)) } </span> }

      <div className={styles.actions}>
        {
          send ? <NavLink to={`/wallet/transfer/${address}`}>
            <div className={styles.action}>
              <SendIcon />
            </div>
          </NavLink> : null
        }
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