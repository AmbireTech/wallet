import React, { useEffect, useState, useContext } from 'react'
import cn from 'classnames'
import { RiWifiOffLine } from 'react-icons/ri'
import styles from './OfflineContext.module.scss'

const OfflineContext = React.createContext(false)

const OfflineProvider = ({ children }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const updateOnlineStatus = (event) => {
      setIsOffline(!navigator.onLine)
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])
  return (
    <OfflineContext.Provider value={isOffline}>
      <span className={cn(styles.message, { [styles.active]: isOffline })}>
        <RiWifiOffLine className={styles.icon} />
        You are currently offline.
      </span>
      {children}
    </OfflineContext.Provider>
  )
}

export const useOfflineStatus = () => {
  return useContext(OfflineContext)
}

export default OfflineProvider
