import './TextInput.css'

import { MdContentCopy } from 'react-icons/md'

export default function TextInput({ value, disabled, copy }) {
    const onClick = () => {
        navigator.clipboard.writeText(value)
    };

    return (
        <div className={`text-input ${copy ? 'copy' : ''}`} onClick={onClick}>
            <input value={value} type="text" disabled={copy || disabled}/>
            {
                copy ?
                    <div className="icon">
                        <MdContentCopy file={15}/>
                    </div>
                    :
                    null
            }
        </div>
    )
}