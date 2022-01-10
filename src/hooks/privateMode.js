import { useState } from 'react';

export default function usePrivateMode() {
    const [isPrivateMode, setIsPrivateMode] = useState(() => {
        const privateModeSelected = localStorage.getItem('isPrivateMode')
        return privateModeSelected ? JSON.parse(privateModeSelected) : false
    });

    const togglePrivateMode = () => {
        setIsPrivateMode(!isPrivateMode)
        localStorage.setItem('isPrivateMode', !isPrivateMode)
    }

    const formatPrivateMode = (value) => {
        if (isPrivateMode) return '**'
        return value
    }

    return {
        isPrivateMode,
        formatPrivateMode,
        togglePrivateMode
    }
}