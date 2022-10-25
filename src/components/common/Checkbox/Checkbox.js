import React, { forwardRef } from 'react';
import styles from './Checkbox.module.scss'

const Checkbox = forwardRef(({ checked, required, onChange, disabled, label, labelClassName}, ref) => {
    const inputElem =  (
        <input type="checkbox" checked={checked} required={required} onChange={onChange} ref={ref}/>
    )

    return label ? (<label className={`${styles.checkboxContainer} ${disabled ? styles.disabled : ''}`}>
        {inputElem}
        <div className={styles.checkboxMark}></div>
        <div className={`${styles.label}${` ${labelClassName}`}`}>{label}</div>
    </label>) : (<>
        {inputElem}
        <div className={styles.checkboxMark}></div>
    </>)
})

export { Checkbox as default }