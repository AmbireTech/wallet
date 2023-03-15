import useRelayerDataCommon from 'ambire-common/src/hooks/useRelayerData'
import { useOfflineStatus } from 'components/OfflineWrapper/OfflineWrapper'

const useRelayerData = (props) => useRelayerDataCommon({ fetch, useOfflineStatus, ...props })

export default useRelayerData
