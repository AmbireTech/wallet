import React, { useEffect, useState, useContext } from 'react'

const OfflineContext = React.createContext(false)

const OfflineProvider = ({ children }) => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine)
    
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
        <OfflineContext.Provider value={isOffline}>
            {children}
        </OfflineContext.Provider>
    )
}

export const useOfflineStatus = () => {
    return useContext(OfflineContext)
}

export default OfflineProvider
