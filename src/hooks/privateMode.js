import { useState, useEffect } from 'react';

export default function usePrivateMode() {
    const [isPrivateMode, setIsPrivateMode] = useState(() => {
        const privateModeSelected = localStorage.isPrivateMode
        return privateModeSelected ? JSON.parse(privateModeSelected) : false
    });

    useEffect(() => {
        console.log(localStorage.isPrivateMode)
        localStorage.isPrivateMode = isPrivateMode
        console.log(localStorage.isPrivateMode)
    }, [isPrivateMode])

    const formatPrivateMode = (value) => {
        if (isPrivateMode) return '**'

        return value
    }

    return {
        isPrivateMode,
        setIsPrivateMode,
        formatPrivateMode
    }
}