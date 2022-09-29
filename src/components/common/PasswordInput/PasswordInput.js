import './PasswordInput.scss'

import { forwardRef, useState } from 'react'

const PasswordInput = forwardRef(({ label, placeholder, autoComplete, peakPassword, disabled, value, onInput, onChange }, ref) => {
    const [showPassword, setShowPassword] = useState()

    return (
        <div className="password-input">
            {
                label ?
                    <label>{ label }</label>
                    :
                    null
            }
            <div className="input-container">
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
                            <div className="button" onClick={() => setShowPassword(true)}>
                                <img src="/resources/icons/visible.svg" alt="visible" />
                            </div>
                            :
                            <div className="button" onClick={() => setShowPassword(false)}>
                                <img src="/resources/icons/invisible.svg" alt="visible" />
                            </div>
                        :
                        null
                }
            </div>
        </div>
    )
})

export default PasswordInput