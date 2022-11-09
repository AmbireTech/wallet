import { Select } from "components/common"

import styles from './FeeCurrencySelect.module.scss'

const FeeCurrencySelect = ({
  estimation,
  disabled,
  currenciesItems,
  onFeeCurrencyChange
}) => {
  
  return estimation.feeInUSD ? ( 
  <div className={styles.section}>
    <div className={styles.sectionTitle}>Fee Currency</div>
    <Select
      className={styles.feeSelect}
      disabled={disabled}
      defaultValue={estimation.selectedFeeToken?.address || estimation.selectedFeeToken?.symbol}
      items={currenciesItems}
      onChange={onFeeCurrencyChange}
    />
  </div>) : null
}

export default FeeCurrencySelect