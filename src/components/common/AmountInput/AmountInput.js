import './AmountInput.scss'

import { forwardRef, useCallback } from 'react'
import BigNumber from 'bignumber.js'

const AmountInput = forwardRef(({
  value,
  className,
  title,
  pattern,
  autoComplete,
  required,
  placeholder,
  label,
  buttonLabel,
  disabled,
  small,
  onChange,
  style,
  decimals = 1
}, ref) => {

  const onChangeWrapper = useCallback((val) => {
    if (val !== '') {
      if (
        (val.endsWith('.') && val.split('.').length === 2)
        || (val.split('.').length === 2 && val.endsWith('0'))
      ) {
        if (val.startsWith('.')) {
          val = '0' + val
        } else {
          val = val.replace(/^0+(\d)/g, '$1')
        }

        if (!(val.endsWith('.') && val.split('.').length === 2) && isNaN(val)) {
          return
        }
      } else if (!isNaN(val)) {
        //val = val.replace(/(\.\d*?)(0+)$/g, '$1')
        val = val.replace(/^0+(\d)/g, '$1')
      } else {
        return
      }
    }

    if (val < 0) val = Math.abs(val)
    onChange && onChange({
      human: val,
      withDecimals: new BigNumber(val).multipliedBy(10 ** decimals).toFixed(0)
    })
  }, [onChange, decimals])

  return (
    <div className={`text-input ${small ? 'small' : ''} ${className}`}>
      {
        label ?
          <label>{label}</label>
          :
          null
      }
      <div className='text-input-container'>
        <input
          value={value}
          title={title}
          pattern={pattern}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          disabled={disabled}
          onChange={ev => onChangeWrapper(ev.target.value)}
          ref={ref}
          style={style}
        />
      </div>
    </div>
  )
})

export default AmountInput
