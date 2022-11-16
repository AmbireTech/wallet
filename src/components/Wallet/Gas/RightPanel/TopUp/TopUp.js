import { NavLink } from 'react-router-dom'

import { useCheckMobileScreen, useDragAndDrop } from 'hooks'

import { ToolTip, Button, Loading } from 'components/common'

import { MdDragIndicator, MdOutlineSort } from 'react-icons/md'
import Token from './Token/Token'

const TopUp = ({ portfolio, userSorting, account, network, setUserSorting, availableFeeAssets }) => {
  const { isBalanceLoading } = portfolio
  const sortType = userSorting.tokens?.sortType || 'decreasing'
  const isMobileScreen = useCheckMobileScreen()

  const sortedTokens = availableFeeAssets
    ?.filter((item) => !item.disableGasTankDeposit)
    .sort((a, b) => b.balanceUSD - a.balanceUSD)
    .sort((a, b) => {
      if (sortType === 'custom' && userSorting.tokens?.items?.[`${account}-${network.chainId}`]?.length) {
        const addressA = userSorting.tokens.items[`${account}-${network.chainId}`].indexOf(a.address.toLowerCase())
        const addressB = userSorting.tokens.items[`${account}-${network.chainId}`].indexOf(b.address.toLowerCase())
        const sorted = addressA - addressB
        return sorted
      } else {
        const decreasing = b.balanceUSD - a.balanceUSD
        if (decreasing === 0) return a.symbol.toUpperCase().localeCompare(b.symbol.toUpperCase())
        return decreasing
      }
    })

  const onDropEnd = (list) => {
    setUserSorting((prev) => ({
      ...prev,
      tokens: {
        sortType: 'custom',
        items: {
          ...prev.tokens?.items,
          [`${account}-${network.chainId}`]: list,
        },
      },
    }))
  }

  const { dragStart, dragEnter, target, handle, dragTarget, drop } = useDragAndDrop('address', onDropEnd)

  return (
    <div>
      <div className="sort-holder">
        <span className="title">Available fee tokens on {network.id.toUpperCase()}</span>
        {sortedTokens && !isMobileScreen && (
          <div className="sort-buttons">
            <ToolTip label="Sorted tokens by drag and drop">
              <MdDragIndicator
                color={sortType === 'custom' ? '#80ffdb' : ''}
                cursor="pointer"
                onClick={() =>
                  setUserSorting((prev) => ({
                    ...prev,
                    tokens: {
                      ...prev.tokens,
                      sortType: 'custom',
                    },
                  }))
                }
              />
            </ToolTip>
            <ToolTip label="Sorted tokens by DESC balance">
              <MdOutlineSort
                color={sortType === 'decreasing' ? '#80ffdb' : ''}
                cursor="pointer"
                onClick={() =>
                  setUserSorting((prev) => ({
                    ...prev,
                    tokens: {
                      ...prev.tokens,
                      sortType: 'decreasing',
                    },
                  }))
                }
              />
            </ToolTip>
          </div>
        )}
      </div>
      <div className="list">
        {!isBalanceLoading ? (
          sortedTokens &&
          sortedTokens?.map(({ address, symbol, tokenImageUrl, balance, balanceUSD, network, decimals, icon }, i) => (
            <Token
              key={`token-${address}-${i}`}
              index={i}
              img={icon}
              symbol={symbol}
              balance={balance}
              balanceUSD={balanceUSD}
              address={address}
              send={false} // TODO
              network={network}
              category="tokens"
              sortedTokensLength={sortedTokens.length}
              // Drag
              handle={handle}
              target={target}
              dragStart={dragStart}
              dragEnter={dragEnter}
              dragTarget={dragTarget}
              isMobileScreen={isMobileScreen}
              drop={drop}
              sortType={sortType}
              sortedTokens={sortedTokens}
            />
          ))
        ) : (
          <Loading />
        )}
      </div>
      <div>
        <NavLink
          to={{
            pathname: `/wallet/transfer/`,
            state: {
              gasTankMsg: 'Warning: You are about to top up your Gas Tank. Top ups to the Gas Tank are non-refundable.',
              isTopUp: true,
            },
          }}
        >
          <Button primaryGradient={true} className="deposit-button buttonComponent" small>
            Top up Gas Tank
          </Button>
        </NavLink>
      </div>
    </div>
  )
}

export default TopUp
