import { useState, useCallback } from 'react'
import networks from 'consts/networks'

export default function useNetwork ({ defaultNetwork = 'ethereum' } = {}) {
    const [networkId, setNetworkId] = useState(() =>
        networks.find(n => n.id === localStorage.network) ? localStorage.network : defaultNetwork
    )
    const setNetwork = useCallback(networkIdentifier => {
        const network = networks.find(n => n.id === networkIdentifier || n.name === networkIdentifier || n.chainId === networkIdentifier)
        if (!network) throw new Error(`no network found: ${networkIdentifier}`)
        localStorage.network = network.id
        setNetworkId(network.id)
    }, [setNetworkId])

    return {
        setNetwork,
        network: networks.find(n => n.id === networkId),
        allNetworks: networks
    }
}