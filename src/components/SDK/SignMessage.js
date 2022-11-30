import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

export default function SignMessage({selectedAcc, selectedNetwork, addRequest, everythingToSign}) {
    const [hasLoaded, setHasLoaded] = useState(false)
    const { type, messageToSign } = useParams()

    const req = useMemo(() => {
        if (!type || !['personal_sign', 'eth_signTypedData'].includes(type)) return null
        if (!messageToSign) return null

        return {
            id: `sdk_sign_${Date.now()}`,
            type: type,
            chainId: selectedNetwork.chainId,
            account: selectedAcc,
            txn: type === 'eth_signTypedData' ? JSON.parse(decodeURIComponent(messageToSign)) : messageToSign,
            dapp: {
                // TODO: dummy data, replace it with something coming from as input params
                name: 'Example Dapp',
                url: 'http://example-dapp.local',
                icons: [
                    'https://sigtool.ambire.com/favicon.ico',
                ]
            },
            // notification: true
        }
    }, [type, messageToSign, selectedNetwork.chainId, selectedAcc])

    useEffect(() => {
        if (hasLoaded || !req) return

        addRequest(req)
        setHasLoaded(true)
    }, [hasLoaded, addRequest, req])

    useEffect(() => {
        if (!hasLoaded || everythingToSign.length > 0) return

        window.parent.postMessage({
            type: 'signClose',
        }, '*')

        setHasLoaded(false)
    }, [hasLoaded, everythingToSign])

    return (null)
}
