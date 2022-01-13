import './TextInput.scss'

import { forwardRef } from 'react';
import { MdContentCopy } from 'react-icons/md';
import { useToasts } from 'hooks/toasts';

const TextInput = forwardRef(({ value, className, title, pattern, autoComplete, required, minLength, maxLength, placeholder, info, label, buttonLabel, password, disabled, copy, small, onInput, onChange, onButtonClick, style }, ref) => {
    const { addToast } = useToasts();

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
                    type={password ? 'password' : 'text'}
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
                    buttonLabel ?
                        <div className="button" onClick={onButtonClick}>
                            { buttonLabel }
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