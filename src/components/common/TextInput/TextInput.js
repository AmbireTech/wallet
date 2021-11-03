import './TextInput.css'

import { MdContentCopy } from 'react-icons/md';
import { useToasts } from '../../../helpers/toasts';

export default function TextInput({ value, disabled, copy }) {
    const { addToast } = useToasts();

    const onClick = async () => {
        await navigator.clipboard.writeText(value);
        addToast("Copied to clipboard!");
    };

    return (
        <div className={`text-input ${copy ? 'copy' : ''}`} onClick={onClick}>
            <input value={value} type="text" disabled={copy || disabled}/>
            {
                copy ?
                    <div className="icon">
                        <MdContentCopy size={20}/>
                    </div>
                    :
                    null
            }
        </div>
    )
}