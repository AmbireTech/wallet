import { useState } from 'react';

export default function usePrivateMode() {
    const [isPrivateMode, setIsPrivateMode] = useState(!!JSON.parse(localStorage.getItem('isPrivateMode')));

    const togglePrivateMode = () => {
        setIsPrivateMode(!isPrivateMode)
        localStorage.setItem('isPrivateMode', !isPrivateMode)
    }

    const hidePrivateValue = (value) => isPrivateMode ? '**' : value;

    const hidePrivateContent = (content) => isPrivateMode ? <div className='private-content'>{content}</div> : content;
    
    return {
        isPrivateMode,
        hidePrivateValue,
        hidePrivateContent,
        togglePrivateMode
    }
}