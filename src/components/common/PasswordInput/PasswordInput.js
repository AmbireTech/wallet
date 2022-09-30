import styles from './PasswordInput.module.scss'

import { forwardRef, useState } from 'react'

const PasswordInput = forwardRef(({ label, placeholder, autoComplete, peakPassword, disabled, value, onInput, onChange, className }, ref) => {
    const [showPassword, setShowPassword] = useState()

    return (
        <div className={`${styles.passwordInput} ${className || ''}`}>
            {
                label ?
                    <label>{ label }</label>
                    :
                    null
            }
            <div className={styles.inputContainer}>
                <input
                    value={value}
                    autoComplete={autoComplete}
                    type={!showPassword ? 'password' : 'text'}
                    placeholder={placeholder}
                    disabled={disabled}
                    onInput={ev => onInput && onInput(ev.target.value)}
                    onChange={ev => onChange && onChange(ev.target.value)}
                    ref={ref}
                />
                {
                    peakPassword ?
                        !showPassword ?
                            <div className={styles.button} onClick={() => setShowPassword(true)}>
                                <img src="/resources/icons/visible.svg" alt="visible-icon" />
                            </div>
                            :
                            <div className={styles.button} onClick={() => setShowPassword(false)}>
                                <img src="/resources/icons/invisible.svg" alt="invisible-icon" />
                            </div>
                        :
                        null
                }
            </div>
        </div>
    )
})

export default PasswordInput