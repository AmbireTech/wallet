import { forwardRef } from 'react'
import cn from 'classnames'
import { MdContentCopy } from 'react-icons/md'

import { useToasts } from 'hooks/toasts'

import styles from './TextInput.module.scss'

const TextInput = forwardRef(
  (
    {
      value,
      className,
      title,
      pattern,
      autoComplete,
      required,
      minLength,
      maxLength,
      placeholder,
      info,
      label,
      buttonLabel,
      password,
      disabled,
      copy,
      small,
      onInput,
      onChange,
      onButtonClick,
      style,
      icon,
      inputContainerClass,
      testId,
      labelClassName
    },
    ref
  ) => {
    const { addToast } = useToasts()

    const onClick = async () => {
      await navigator.clipboard.writeText(value)
      addToast('Copied to clipboard!')
    }

    return (
      <div
        className={`${styles.textInput} ${copy ? styles.copy : ''} ${small ? styles.small : ''} ${
          className || ''
        }`}
      >
        {label ? <p className={cn(styles.label, labelClassName)}>{label}</p> : null}
        <div
          role="button"
          className={`${styles.container}${inputContainerClass ? ` ${inputContainerClass}` : ''}${
            icon ? ` ${styles.hasIcon}` : ''
          }`}
          onClick={copy ? onClick : null}
          onKeyUp={(e) => e.key === 'Enter' && copy && onClick()}
          tabIndex="0"
        >
          <input
            value={value}
            title={title}
            pattern={pattern}
            autoComplete={autoComplete}
            required={required}
            minLength={minLength}
            maxLength={maxLength}
            type={password ? 'password' : 'text'}
            placeholder={placeholder}
            disabled={copy || disabled}
            onInput={(ev) => onInput && onInput(ev.target.value)}
            onChange={(ev) => onChange && onChange(ev.target.value)}
            ref={ref}
            style={style}
            data-testid={testId}
          />
          {icon && <div className={styles.textInputContainerIcon}>{icon}</div>}
          {copy ? (
            <div className={styles.button}>
              <MdContentCopy />
            </div>
          ) : null}
          {buttonLabel ? (
            <button type="button" className={styles.button} onClick={onButtonClick}>
              {buttonLabel}
            </button>
          ) : null}
        </div>
        {info ? <div className={styles.info}>{info}</div> : null}
      </div>
    )
  }
)

export default TextInput
