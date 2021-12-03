import './TextInput.scss'

import { forwardRef } from 'react';
import { MdContentCopy } from 'react-icons/md';
import { useToasts } from '../../../hooks/toasts';

const TextInput = forwardRef(({ value, title, pattern, autoComplete, required, minLength, maxLength, placeholder, info, label, password, disabled, copy, small, onInput, onChange }, ref) => {
    const { addToast } = useToasts();

    const onClick = async () => {
        await navigator.clipboard.writeText(value);
        addToast("Copied to clipboard!");
    };

    return (
        <div className={`text-input ${copy ? 'copy' : ''} ${small ? 'small' : ''}`}>
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
                />
                {
                    copy ?
                        <div className="icon">
                            <MdContentCopy size={20}/>
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