import { useState, useCallback } from 'react'
import networks from '../consts/networks'

export default function useNetwork ({ defaultNetwork = 'ethereum' } = {}) {
    const [networkName, setNetworkName] = useState(() =>
        networks[localStorage.network] ? localStorage.network : defaultNetwork
    )
    const setNetwork = useCallback(networkNameOrKey => {
        let networkKey
        if (networks[networkNameOrKey]) networkKey = networkNameOrKey
        else networkKey = (Object.entries(networks).find(([key, val]) => val.name === networkNameOrKey) || [])[0]
        if (!networkKey) throw new Error(`no network found: ${networkNameOrKey}`)
        localStorage.network = networkKey
        setNetworkName(networkKey)
    }, [setNetworkName])

    return {
        setNetwork,
        network: networks[networkName],
        allNetworks: networks
    }
}