import { forwardRef, useState } from 'react'

import { ReactComponent as VisibleIcon } from 'resources/icons/visible.svg'
import { ReactComponent as InvisibleIcon } from 'resources/icons/invisible.svg'

import cn from 'classnames'
import styles from './PasswordInput.module.scss'

const PasswordInput = forwardRef(
  (
    {
      label,
      placeholder,
      autoComplete,
      peakPassword,
      disabled,
      value,
      onInput,
      onChange,
      className
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState()

    return (
      <div className={cn(styles.passwordInput, className || '')}>
        {label ? <label>{label}</label> : null}
        <div className={styles.inputContainer}>
          <input
            value={value}
            autoComplete={autoComplete}
            type={!showPassword ? 'password' : 'text'}
            placeholder={placeholder}
            disabled={disabled}
            onInput={(ev) => onInput && onInput(ev.target.value)}
            onChange={(ev) => onChange && onChange(ev.target.value)}
            ref={ref}
          />
          {peakPassword ? (
            !showPassword ? (
              <div className={styles.button} onClick={() => setShowPassword(true)}>
                <VisibleIcon />
              </div>
            ) : (
              <div className={styles.button} onClick={() => setShowPassword(false)}>
                <InvisibleIcon />
              </div>
            )
          ) : null}
        </div>
      </div>
    )
  }
)

export default PasswordInput
