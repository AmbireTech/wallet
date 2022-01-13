import { useState } from 'react';

export default function usePrivateMode() {
    const [isPrivateMode, setIsPrivateMode] = useState(!!JSON.parse(localStorage.getItem('isPrivateMode')));

    const togglePrivateMode = () => {
        setIsPrivateMode(!isPrivateMode)
        localStorage.setItem('isPrivateMode', !isPrivateMode)
    }

    const hidePrivateValue = (value, showValueLength) => isPrivateMode ? (showValueLength ? [...Array(value.length).keys()].map(e => '*') : '**' ) : value;

    const hidePrivateContent = (content) => isPrivateMode ? <div className='private-content'>{content}</div> : content;
    
    return {
        isPrivateMode,
        hidePrivateValue,
        hidePrivateContent,
        togglePrivateMode
    }
}