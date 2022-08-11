import useRelayerDataCommon from 'ambire-common/src/hooks/useRelayerData'

const useRelayerData = (url) => useRelayerDataCommon({ fetch, url })

export default useRelayerData
