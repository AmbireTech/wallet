import useRelayerDataCommon from 'ambire-common/src/hooks/useRelayerData'
import { useOfflineStatus } from 'context/OfflineContext/OfflineContext'

const useRelayerData = (props) => {
  const isOffline = useOfflineStatus()
  
  return useRelayerDataCommon({ fetch, isOffline, ...props })
}

export default useRelayerData
