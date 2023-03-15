import React, { useEffect, useState, useContext } from 'react'
import OfflineView from './OfflineView'

const OfflineContext = React.createContext(false)

const OfflineWrapper = ({ children }) => {
    const [isOffline, setIsOffline] = useState(false)
    console.log('isOfflineWrapper', isOffline)
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
            { isOffline ? (<OfflineView/>) : (children) }
        </OfflineContext.Provider>
    )
}

export const useOfflineStatus = () => {
    return useContext(OfflineContext)
}

export default OfflineWrapper
