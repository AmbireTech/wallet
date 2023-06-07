import useRelayerDataCommon from 'ambire-common/src/hooks/useRelayerData'
import { useOfflineStatus } from 'context/OfflineContext/OfflineContext'

const useRelayerData = (props) => useRelayerDataCommon({ fetch, useOfflineStatus, ...props })

export default useRelayerData
