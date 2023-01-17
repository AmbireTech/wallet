import cn from 'classnames'

import { formatFloatTokenAmount } from 'lib/formatters'

import { useSDKContext } from 'components/SDKProvider/SDKProvider'
import { getDiscountApplied } from 'components/SendTransaction/helpers'

import { MdInfoOutline } from 'react-icons/md'

import styles from './FeesBreakdown.module.scss'

const FeesBreakdown = ({
  discount,
  estimation,
  feeInUSD,
  baseFeeInFeeToken,
  savedGas,
  isGasTankEnabled,
  decimals,
  walletDiscountBlogpost,
  DISCOUNT_TOKENS_SYMBOLS
}) => {
  const { isSDK } = useSDKContext()
  const discountInUSD = getDiscountApplied(feeInUSD, discount)
  const baseFeeInUSD = feeInUSD + discountInUSD
  
  return !isSDK ? (
    <div className={styles.wrapper}>
      {(<div className={styles.fee}>
        <p className={styles.feeSide}>
          Fee
          {!!discount && <span className={styles.discount}>*</span>}
          {!!(discount && DISCOUNT_TOKENS_SYMBOLS.includes(estimation.selectedFeeToken?.symbol)) && <a
              className="address row discount-label"
              href={walletDiscountBlogpost}
              target="_blank"
              rel="noreferrer">
              &nbsp;<MdInfoOutline />
            </a>
          }:
          {
            !isNaN(baseFeeInFeeToken) ? ` ${formatFloatTokenAmount(baseFeeInFeeToken, true, decimals) + ' ' + estimation?.selectedFeeToken?.symbol}` : ' -'
          }
        </p>
        {
          !isNaN(baseFeeInUSD) && <p className={styles.feeSide}>
            ~$ {formatFloatTokenAmount(baseFeeInUSD, true, 4)}
          </p>
        }
      </div>)}

      {!!discount && (<div className={cn(styles.fee, styles.discount)}>
        <p className={styles.feeSide}>
          You save ({discount * 100}%):
          {/* <div>
            {discountInFeeToken + ' ' + estimation.selectedFeeToken.symbol}
          </div> */}
        </p>
        <p className={styles.feeSide}>
          ~$ {formatFloatTokenAmount(discountInUSD, true, 4)}
        </p>
      </div>)}

      {!!discount && (<div className={cn(styles.fee, styles.discount)}>
        <p className={styles.feeSide}>
          You pay:
        </p>
        <p className={styles.feeSide}>
          ~$ {formatFloatTokenAmount(feeInUSD, true, 4)}
        </p>
      </div>)}
      {!isGasTankEnabled && !isNaN((feeInUSD / estimation.gasLimit) * savedGas) && 
          <div className={cn(styles.fee, styles.warning)}>
            <p className={styles.feeSide}>
              Enable Gas Tank to save:
            </p>
            <p className={styles.feeSide}>
              $ {formatFloatTokenAmount(((feeInUSD / estimation.gasLimit) * savedGas), true, 4)}
            </p>
          </div>}
      {!!isGasTankEnabled && (<>
        <div className={cn(styles.fee, styles.discount)}>
          <p className={styles.feeSide}>
            Gas Tank fee token balance:
          </p>
          <p className={styles.feeSide}>
            $ {formatFloatTokenAmount(estimation.selectedFeeToken.balanceInUSD, true, 4)}
          </p>
        </div>
      {!isNaN((feeInUSD / estimation.gasLimit) * savedGas) && 
          <div className={cn(styles.fee, styles.discount)}>
            <p className={styles.feeSide}>
              Gas Tank saves you:
            </p>
            <p className={styles.feeSide}>
              $ {formatFloatTokenAmount(((feeInUSD / estimation.gasLimit) * savedGas), true, 4)}
            </p>
          </div>}
      </>)}
    </div>
  ) : null
}

export default FeesBreakdown