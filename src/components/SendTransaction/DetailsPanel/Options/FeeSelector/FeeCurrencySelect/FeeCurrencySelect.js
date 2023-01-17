import { Select } from "components/common"

import styles from './FeeCurrencySelect.module.scss'

const FeeCurrencySelect = ({
  estimation,
  disabled,
  currenciesItems,
  onFeeCurrencyChange
}) => {
  
  return estimation.feeInUSD ? ( 
  <div className={styles.wrapper}>
    <p className={styles.title}>Fee Currency</p>
    <Select
      disabled={disabled}
      defaultValue={estimation.selectedFeeToken?.address || estimation.selectedFeeToken?.symbol}
      items={currenciesItems}
      onChange={onFeeCurrencyChange}
      selectInputClassName={styles.selectInput}
    />
  </div>) : null
}

export default FeeCurrencySelect