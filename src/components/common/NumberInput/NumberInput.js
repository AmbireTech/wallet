import cn from 'classnames'

import styles from './NumberInput.module.scss'

const NumberInput = ({
  disabled,
  precision,
  label,
  value,
  button,
  onButtonClick,
  onInput,
  testId
}) => {
  const onInputValue = ({ target }) => {
    if (!onInput) return
    if (!target.value.length) return onInput('')

    const afterDecimals = target.value.split('.')[1]
    if (afterDecimals && afterDecimals.length > precision) return

    const isIntOrFloat = /^[0-9]+\.{0,1}[0-9]*$/g.test(target.value)
    isIntOrFloat && onInput(target.value)
  }

  return (
    <div className={cn(styles.numberInput, { [styles.disabled]: disabled })}>
      {label ? <label>{label}</label> : null}
      <div className={styles.input}>
        <input
          type="text"
          disabled={disabled}
          value={value}
          onInput={onInputValue}
          data-testid={testId}
        />
        {button ? (
          <div className={styles.button} onClick={onButtonClick}>
            {button}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default NumberInput
