import './TextInput.scss'

import { forwardRef, useState } from 'react';
import { MdContentCopy, MdOutlineRemoveRedEye, MdRemoveRedEye } from 'react-icons/md';
import { useToasts } from '../../../hooks/toasts';

const TextInput = forwardRef(({ value, className, title, pattern, autoComplete, required, minLength, maxLength, placeholder, info, label, password, disabled, copy, small, onInput, onChange, style }, ref) => {
    const { addToast } = useToasts();

    const [showPassword, setShowPassword] = useState()

    const onClick = async () => {
        await navigator.clipboard.writeText(value);
        addToast("Copied to clipboard!");
    };

    return (
        <div className={`text-input ${copy ? 'copy' : ''} ${small ? 'small' : ''} ${className}`}>
            {
                label ?
                    <label>{ label }</label>
                    :
                    null
            }
            <div className="text-input-container" onClick={copy ? onClick : null}>
                <input
                    value={value}
                    title={title}
                    pattern={pattern}
                    autoComplete={autoComplete}
                    required={required}
                    minLength={minLength}
                    maxLength={maxLength}
                    type={password && !showPassword ? 'password' : 'text'}
                    placeholder={placeholder}
                    disabled={copy || disabled}
                    onInput={ev => onInput && onInput(ev.target.value)}
                    onChange={ev => onChange && onChange(ev.target.value)}
                    ref={ref}
                    style={style}
                />
                {
                    copy ?
                        <div className="button">
                            <MdContentCopy size={20}/>
                        </div>
                        :
                        null
                }
                {
                    password ?
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
            {
                info ?
                    <div className="info">
                        { info }
                    </div>
                    :
                    null
            }
        </div>
    )
})

export default TextInput