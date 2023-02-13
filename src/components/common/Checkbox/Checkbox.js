import React, { forwardRef } from 'react'
import cn from 'classnames'
import styles from './Checkbox.module.scss'

const Checkbox = forwardRef(({ checked, required, onChange, disabled, label, labelClassName, className, testId }, ref) => {
    const inputElem =  (
        <input type="checkbox" checked={checked} required={required} onChange={onChange} ref={ref} data-testid={testId}/>
    )

    return label ? (<label className={cn(styles.checkboxContainer, {[styles.disabled]: disabled, [className]: className})}>
        {inputElem}
        <div className={styles.checkboxMark}></div>
        <div className={`${styles.label}${` ${labelClassName}`}`}>{label}</div>
    </label>) : (<div>
        {inputElem}
        <div className={styles.checkboxMark}></div>
    </div>)
})

export { Checkbox as default }