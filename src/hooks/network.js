import { useCallback } from 'react'
import networks from 'consts/networks'

export default function useNetwork ({ defaultNetwork = 'ethereum', useStorage } = {}) {
    const [networkId, setNetworkId] = useStorage({
        key: 'network',
        defaultValue: defaultNetwork,
        isStringStorage: true,
        setInit: networkId => networks.find(n => n.id === networkId) ? networkId : defaultNetwork
    })

    const setNetwork = useCallback(networkIdentifier => {
        const network = networks.find(n => n.id === networkIdentifier || n.name === networkIdentifier || n.chainId === networkIdentifier)
        if (!network) throw new Error(`no network found: ${networkIdentifier}`)

        setNetworkId(network.id)
    }, [setNetworkId])

    return {
        setNetwork,
        network: networks.find(n => n.id === networkId),
        allNetworks: networks
    }
}
