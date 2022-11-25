import React, { useEffect, useState } from 'react'

const OfflineContext = React.createContext(null)

const OfflineProvider = ({ children }) => {
    const [isOffline, setIsOffline] = useState(false)
    useEffect(() => {
        const updateOnlineStatus = (event) => {
            setIsOffline(!navigator.onLine)
        }
        
        window.addEventListener('online',  updateOnlineStatus)
        window.addEventListener('offline', updateOnlineStatus)
        return () => {
            window.removeEventListener('online',  updateOnlineStatus)
            window.removeEventListener('offline', updateOnlineStatus)
        }
    }, [])
    return (
        <OfflineContext.Provider value={{ isOffline }}>
            {children}
        </OfflineContext.Provider>
    )
}

export { OfflineContext }
export default OfflineProvider
