import { useState } from 'react'
import styles from './Radios.module.scss'

const Radios = ({ radios, defaultValue, onChange, value, row, className, radioClassName }) => {
  const [currentValue, setCurrentValue] = useState(defaultValue || null)
  const controlledValue = value || currentValue

  const onSelect = (radioItemValue, disabled) => {
    console.log(radioItemValue, disabled)
    if (disabled) return

    setCurrentValue(radioItemValue)
    onChange && onChange(radioItemValue)
  }

  return (
    <div className={`${styles.radiosContainer}${row ? ` ${styles.row}` : ''} ${className || ''}`}>
      {radios.map(({ label, value: radioItemValue, disabled }) => (
        <button
          type="button"
          className={`${styles.radioContainer} ${
            radioItemValue === controlledValue ? styles.active : ''
          } ${disabled ? styles.disabled : ''} ${radioClassName || ''}`}
          key={label}
          onClick={() => onSelect(radioItemValue, disabled)}
        >
          {/* <div className={styles.radio}></div> */}
          <div className={styles.radio}>
            <div className={styles.radioInner} />
          </div>
          <p className={styles.label}>{label}</p>
        </button>
      ))}
    </div>
  )
}

export default Radios
