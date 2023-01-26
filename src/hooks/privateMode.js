import React from 'react'

export default function usePrivateMode(useStorage) {
    const [ isPrivateMode, setIsPrivateMode ] = useStorage({ key: 'isPrivateMode' })

    const togglePrivateMode = () => {
        setIsPrivateMode(!isPrivateMode)
    }

    const hidePrivateValue = React.useCallback((value) => isPrivateMode ?
		(typeof value === 'string' && value.startsWith('0x') ? value.replace(/./gi, '*') : '**')
		: value, [isPrivateMode])

    const hidePrivateContent = (content) => isPrivateMode ? <div className='private-content'>{content}</div> : content;

    return {
        isPrivateMode,
        hidePrivateValue,
        hidePrivateContent,
        togglePrivateMode
    }
}
