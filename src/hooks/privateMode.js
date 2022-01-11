import { useState } from 'react';

export default function usePrivateMode() {
    const [isPrivateMode, setIsPrivateMode] = useState(JSON.parse(localStorage.getItem('isPrivateMode')) || false);

    const togglePrivateMode = () => {
        setIsPrivateMode(!isPrivateMode)
        localStorage.setItem('isPrivateMode', !isPrivateMode)
    }

    const hidePrivateValue = (value) => isPrivateMode ? '**' : value;

    return {
        isPrivateMode,
        hidePrivateValue,
        togglePrivateMode
    }
}