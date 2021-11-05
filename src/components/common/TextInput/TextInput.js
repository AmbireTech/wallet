import './TextInput.scss'

import { MdContentCopy } from 'react-icons/md';
import { useToasts } from '../../../hooks/toasts';

export default function TextInput({ value, placeholder, info, button, disabled, copy }) {
    const { addToast } = useToasts();

    const onClick = async () => {
        await navigator.clipboard.writeText(value);
        addToast("Copied to clipboard!");
    };

    return (
        <div className={`text-input ${copy ? 'copy' : ''}`} onClick={copy ? onClick : null}>
            <input value={value} type="text" placeholder={placeholder} disabled={copy || disabled}/>
            {
                info ?
                    <div className="info">
                        { info }
                    </div>
                    :
                    null
            }
            {
                copy ?
                    <div className="icon">
                        <MdContentCopy size={20}/>
                    </div>
                    :
                    null
            }
            {
                button ?
                    <div className="button">
                        { button }
                    </div>
                    :
                    null
            }
        </div>
    )
}