import './PasswordInput.scss'

import { forwardRef, useState } from 'react'
import { MdOutlineRemoveRedEye, MdRemoveRedEye } from 'react-icons/md'

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
                                <MdOutlineRemoveRedEye size={20}/>
                            </div>
                            :
                            <div className="button" onClick={() => setShowPassword(false)}>
                                <MdRemoveRedEye size={20}/>
                            </div>
                        :
                        null
                }
            </div>
        </div>
    )
})

export default PasswordInput