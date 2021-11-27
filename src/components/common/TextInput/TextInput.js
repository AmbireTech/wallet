import './TextInput.scss'

import { forwardRef } from 'react';
import { MdContentCopy } from 'react-icons/md';
import { useToasts } from '../../../hooks/toasts';

const TextInput = forwardRef(({ value, placeholder, info, label, password, disabled, copy, onInput }, ref) => {
    const { addToast } = useToasts();

    const onClick = async () => {
        await navigator.clipboard.writeText(value);
        addToast("Copied to clipboard!");
    };

    return (
        <div className={`text-input ${copy ? 'copy' : ''}`}>
            {
                label ?
                    <label>{ label }</label>
                    :
                    null
            }
            <div className="text-input-container" onClick={copy ? onClick : null}>
                <input value={value} type={password ? 'password' : 'text'} placeholder={placeholder} disabled={copy || disabled} onInput={ev => onInput(ev.target.value)} ref={ref}/>
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