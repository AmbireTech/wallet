import cn from 'classnames'

import { isTokenEligible } from 'components/SendTransaction/helpers'
import { Button } from 'components/common'

import { FaPercentage } from 'react-icons/fa'
import { MdInfoOutline } from 'react-icons/md'
import { NavLink } from 'react-router-dom'

import styles from './WalletDiscountBanner.module.scss'

function getBalance(token) {
  const { balance, decimals, priceInUSD } = token
  return (balance / decimals) * priceInUSD
}

const WalletDiscountBanner = ({
  currenciesItems,
  tokens,
  estimation,
  onFeeCurrencyChange,
  onDismiss,
  feeSpeed,
  isGasTankEnabled,
  network,
  DISCOUNT_TOKENS_SYMBOLS,
  walletDiscountBlogpost
}) => {
  if (
    estimation.selectedFeeToken?.symbol &&
    (DISCOUNT_TOKENS_SYMBOLS.includes(estimation.selectedFeeToken?.symbol) ||
      estimation.selectedFeeToken.discount)
  ) {
    return null
  }
  const walletDiscountTokens = [...tokens]
    .filter(
      (x) =>
        DISCOUNT_TOKENS_SYMBOLS.includes(x.symbol) &&
        x.discount &&
        isTokenEligible(x, feeSpeed, estimation, isGasTankEnabled, network)
    )
    .sort(
      (a, b) =>
        b.discount - a.discount ||
        (!parseInt(a.balance) || !parseInt(b.balance) ? getBalance(b) - getBalance(a) : 0) ||
        DISCOUNT_TOKENS_SYMBOLS.indexOf(a.symbol) - DISCOUNT_TOKENS_SYMBOLS.indexOf(b.symbol)
    )

  if (!walletDiscountTokens.length) return null

  const discountToken = walletDiscountTokens[0]

  const { discount } = discountToken
  const eligibleWalletToken = currenciesItems.find(
    (x) => x.value && (x.value === 'WALLET' || x.value === discountToken.address)
  )
  const action = eligibleWalletToken ? () => onFeeCurrencyChange(eligibleWalletToken) : null
  // TODO: go to swap
  const actionTxt = eligibleWalletToken
    ? `USE ${discountToken.symbol}`
    : `BUY ${discountToken.symbol}`
  const showSwap = !action

  return (
    <div className={cn(styles.wrapper, styles.row)}>
      <div className={styles.row}>
        Get {discount * 100} <FaPercentage /> fees discount with &nbsp;<strong>$WALLET</strong>{' '}
        &nbsp;
        <a
          className={styles.row}
          href={walletDiscountBlogpost}
          target="_blank"
          rel="noreferrer noopener"
        >
          <MdInfoOutline />
        </a>
      </div>
      {!!action && (
        <Button onClick={action} size="xsm" className={styles.button}>
          {actionTxt}
        </Button>
      )}
      {showSwap && (
        <div className={styles.swapInfo}>
          You can get $WALLET, just use the &nbsp;
          <NavLink className="link" to="/wallet/swap" onClick={onDismiss}>
            Swap
          </NavLink>{' '}
          menu on the left!
        </div>
      )}
    </div>
  )
}

export default WalletDiscountBanner
