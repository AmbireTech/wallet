import React, { useCallback } from 'react'

export default function usePrivateMode(useStorage) {
  const [isPrivateMode, setIsPrivateMode] = useStorage({ key: 'isPrivateMode' })

  const togglePrivateMode = () => {
    setIsPrivateMode(!isPrivateMode)
  }

  const hidePrivateValue = useCallback(
    (value) =>
      isPrivateMode
        ? typeof value === 'string' && value.startsWith('0x')
          ? value.replace(/./gi, '*')
          : '**'
        : value,
    [isPrivateMode]
  )

  const hidePrivateContent = useCallback(
    (content) => (isPrivateMode ? <div className="private-content">{content}</div> : content),
    [isPrivateMode]
  )

  return {
    isPrivateMode,
    hidePrivateValue,
    hidePrivateContent,
    togglePrivateMode
  }
}
