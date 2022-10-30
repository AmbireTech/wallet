import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { GiToken } from 'react-icons/gi'
import { MdDragIndicator } from 'react-icons/md'

import { getTokenIcon } from 'lib/icons'
import { formatFloatTokenAmount } from 'lib/formatters'

import { ReactComponent as SendIcon } from 'resources/icons/send.svg'
import { ReactComponent as EarnIcon } from 'resources/icons/earn.svg'
import { ReactComponent as SwapIcon } from 'resources/icons/swap-2.svg'

import styles from './Protocol.module.scss'

const Protocol = ({
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
  dragAndDrop
}) => {
  const [failedImg, setFailedImg] = useState([])
  const logo = failedImg.includes(img) ? getTokenIcon(network, address) : img

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
              failedImg.includes(logo) ?
                <GiToken size={20}/> : <img 
                  src={logo} 
                  draggable="false" 
                  alt="Token Icon" 
                  onError={() => setFailedImg(failed => [...failed, logo])}
                  className={styles.icon}
                />
            }
          </div>
          <div className={styles.amountAndSymbol}>
            <h3 className={styles.symbol}>{ symbol }</h3>
            <p className={styles.balance}>
              { hidePrivateValue(formatFloatTokenAmount(balance.toFixed(2), true, decimals)) }
            </p>
          </div>
        </div>
        <div className={styles.priceAndValue}>
          <h3 className={styles.price}>
            ${price < 1 ? price.toFixed(5) : price.toFixed(2)}
          </h3>
          <h3 className={styles.value}>
            <span className={styles.symbol}>$</span>{ hidePrivateValue(balanceUSD.toFixed(2)) }
          </h3>
        </div>
      </div>

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

export default Protocol