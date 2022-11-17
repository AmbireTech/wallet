import React, { useState } from 'react'
import styles from './Radios.module.scss'

const Radios = ({ radios, defaultValue, onChange, value, row, className }) => {
  const [currentValue, setCurrentValue] = useState(defaultValue || null)
  const controlledValue = value || currentValue

  const onSelect = (val) => {
    setCurrentValue(val)
    onChange && onChange(val)
  }

  return (
    <div className={`${styles.radiosContainer}${row ? ` ${styles.row}` : ''} ${className || ''}`}>
      {radios.map(({ label, val, disabled }, i) => (
        <div
          className={`${styles.radioContainer} ${val === controlledValue ? styles.active : ''} ${
            disabled ? styles.disabled : ''
          }`}
          key={`radio-${i}`}
          onClick={() => !disabled && onSelect(val)}
        >
          {/* <div className={styles.radio}></div> */}
          <div className={styles.radio}>
            <div className={styles.radioInner} />
          </div>
          <label>{label}</label>
        </div>
      ))}
    </div>
  )
}

export default Radios
