import styles from './Radios.module.scss'

import { useState } from 'react'

const Radios = ({ radios, defaultValue, onChange, value, row, className, radioClassName }) => {
    const [currentValue, setCurrentValue] = useState(defaultValue || null)
    const controlledValue = value || currentValue

    const onSelect = value => {
        setCurrentValue(value)
        onChange && onChange(value)
    }

    return (
        <div className={`${styles.radiosContainer}${row ? ` ${styles.row}` : ''} ${className || ''}`}>
            {
                radios.map(({label, value, disabled }, i) => (
                    <div className={`${styles.radioContainer} ${value === controlledValue ? styles.active : ''} ${disabled ? styles.disabled : ''} ${radioClassName || ''}`} key={`radio-${i}`} onClick={() => !disabled && onSelect(value)}>
                        {/* <div className={styles.radio}></div> */}
                        <div className={styles.radio}>
                            <div className={styles.radioInner} />
                        </div>
                        <label>{ label }</label>
                    </div>
                ))
            }
        </div>
    )
}

export default Radios