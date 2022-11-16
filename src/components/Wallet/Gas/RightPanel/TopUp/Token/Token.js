import { NavLink } from 'react-router-dom'

import { getTokenIcon } from 'lib/icons'
import { formatFloatTokenAmount } from 'lib/formatters'

import { Button } from 'components/common'

import { GiToken } from 'react-icons/gi'
import { MdDragIndicator } from 'react-icons/md'
import { useState } from 'react'

const Token = ({
  index,
  img,
  symbol,
  balance,
  balanceUSD,
  address,
  send = false,
  network,
  category,
  sortedTokensLength,
  // Drag
  handle,
  target,
  dragStart,
  dragEnter,
  dragTarget,
  isMobileScreen,
  drop,
  sortType,
  sortedTokens,
}) => {
  const [failedImg, setFailedImg] = useState([])

  const logo = failedImg.includes(img) ? getTokenIcon(network, address) : img

  return (
    <div
      className="token"
      disabled={balance === 0}
      draggable={category === 'tokens' && sortedTokensLength > 1 && sortType === 'custom' && !isMobileScreen}
      onDragStart={(e) => {
        if (handle.current === target.current || handle.current.contains(target.current)) dragStart(e, index)
        else e.preventDefault()
      }}
      onMouseDown={(e) => dragTarget(e, index)}
      onDragEnter={(e) => dragEnter(e, index)}
      onDragEnd={() => drop(sortedTokens)}
      onDragOver={(e) => e.preventDefault()}
    >
      {sortedTokensLength > 1 && sortType === 'custom' && !isMobileScreen && (
        <MdDragIndicator
          size={20}
          className="drag-handle"
          onClick={(e) => dragStart(e, index)}
          id={`${index}-handle`}
        />
      )}
      <div className="icon">
        {failedImg.includes(logo) ? (
          <GiToken size={20} />
        ) : (
          <img
            src={logo}
            draggable="false"
            alt="Token Icon"
            onError={() => setFailedImg((failed) => [...failed, logo])}
          />
        )}
      </div>
      <div className="name">{symbol.toUpperCase()}</div>
      <div className="separator"></div>
      <div className="balance">
        <div className="currency">
          <span className="value">{formatFloatTokenAmount(balance, true, 4)}</span>
        </div>
        <div className="dollar">
          <span className="symbol">$</span> {balanceUSD.toFixed(2)}
        </div>
      </div>
      {send ? (
        <div className="actions">
          <NavLink
            to={{
              pathname: `/wallet/transfer/${address}`,
              state: {
                gasTankMsg:
                  'Warning: You are about to top up your Gas Tank. Top ups to the Gas Tank are non-refundable.',
                isTopUp: true,
              },
            }}
          >
            <Button className="buttonComponent" small>
              Top up
            </Button>
          </NavLink>
        </div>
      ) : null}
    </div>
  )
}

export default Token
