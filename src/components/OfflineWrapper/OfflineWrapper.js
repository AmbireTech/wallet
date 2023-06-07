import { useOfflineStatus } from 'components/OfflineWrapper/OfflineProvider'
import OfflineView from './OfflineView'

const OfflineWrapper = ({ children }) => {
  const isOffline = useOfflineStatus()

  return isOffline ? <OfflineView /> : children
}

export default OfflineWrapper
