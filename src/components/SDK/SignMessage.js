import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

export default function SignMessage({selectedAcc, selectedNetwork, addRequest, everythingToSign}) {
    const [hasLoaded, setHasLoaded] = useState(false)
    const { messageToSign } = useParams()

    const req = useMemo(() => {
        if (!messageToSign) return null

        return {
            id: `sdk_sign_${Date.now()}`,
            type: 'personal_sign',
            chainId: selectedNetwork.chainId,
            account: selectedAcc,
            txn: messageToSign,
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
    }, [messageToSign, selectedNetwork.chainId, selectedAcc])

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
