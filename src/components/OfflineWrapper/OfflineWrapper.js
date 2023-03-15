import React from 'react'
import OfflineView from './OfflineView'
import { useOfflineStatus } from 'components/OfflineWrapper/OfflineProvider'

const OfflineWrapper = ({ children }) => {
    const isOffline = useOfflineStatus()
    
    return (
        isOffline ? (<OfflineView/>) : (children) 
    )
}

export default OfflineWrapper