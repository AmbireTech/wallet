import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { Button, Loading } from 'components/common'

import { networkIconsById } from 'consts/networks'

import Token from './Token/Token'

import { ReactComponent as AlertIcon } from 'resources/icons/alert.svg'

import styles from './TopUp.module.scss'

const TopUp = ({ portfolio, network, availableFeeAssets }) => {
  const { isBalanceLoading } = portfolio

  const sortedTokens = useMemo(() => availableFeeAssets
    ?.filter((item) => !item.disableGasTankDeposit)
    .sort((a, b) => {
      const decreasing = b.balanceUSD - a.balanceUSD
      if (decreasing === 0) return a.symbol.toUpperCase().localeCompare(b.symbol.toUpperCase())
      return decreasing
    }), [availableFeeAssets])

  const zeroBalanceOnAllTokens = useMemo(() => sortedTokens?.every(t => t.balanceUSD <= 0), [sortedTokens])
  return (
    <div className={styles.wrapper}>
      <div className={styles.titleWrapper}>
        <h2 className={styles.title}>Available fee tokens</h2>
        <div className={styles.network}>
          <p>on</p>
          <div className={styles.networkIcon}>
            <img src={networkIconsById[network.id]} alt="" />
          </div>  
          <p className={styles.name}>{network.name}</p>
        </div>
      </div>
      <div className={styles.list}>
        {!isBalanceLoading ? (
          sortedTokens &&
          sortedTokens?.map(({ address, symbol, tokenImageUrl, balance, balanceUSD, network }, i) => (
            <Token
              key={`token-${address}-${i}`}
              index={i}
              img={tokenImageUrl}
              symbol={symbol}
              balance={balance}
              balanceUSD={balanceUSD}
              address={address}
              network={network}
              sortedTokensLength={sortedTokens.length}
            />
          ))
        ) : (
          <Loading />
        )}
      </div>
      <div className={styles.warning}>
        <AlertIcon className={styles.warningIcon} />
        <p className={styles.warningText}>
          <span>Warning:</span> {zeroBalanceOnAllTokens ? `You don't have any funds to top-up your gas tank. Please deposit into your account.` : `It will take some time to top up the Gas Tank after the transaction is signed.`}
        </p>
      </div>
      <div>
        {zeroBalanceOnAllTokens ? <Button primaryGradient  disabled={zeroBalanceOnAllTokens} className={styles.depositBtn}>
            Top up Gas Tank
          </Button> :
        <NavLink
          to={{
            pathname: `/wallet/transfer/`,
            state: {
              gasTankMsg: 'Warning: You are about to top up your Gas Tank. Top ups to the Gas Tank are non-refundable.',
              isTopUp: true,
            },
          }}
        >
          <Button variant="primaryGradient" className={styles.depositBtn}>
            Top up Gas Tank
          </Button>
        </NavLink> }
      </div>
    </div>
  )
}

export default TopUp
