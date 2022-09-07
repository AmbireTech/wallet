import useRelayerDataCommon from 'ambire-common/src/hooks/useRelayerData'

const useRelayerData = (props) => useRelayerDataCommon({ fetch, ...props })

export default useRelayerData
