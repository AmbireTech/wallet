import { useEffect, useMemo, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'

import { useLocalStorage } from 'hooks'
import { useSDKContext } from 'components/SDKProvider/SDKProvider'

const VALID_SIGN_METHODS = ['eth_sign', 'personal_sign', 'eth_signTypedData', 'eth_signTypedData_v4']
const TYPED_DATA_METHODS = ['eth_signTypedData', 'eth_signTypedData_v4']

export default function SignMessage({selectedAcc, selectedNetwork, addRequest, everythingToSign}) {
    const location = useLocation()
    const [hasLoaded, setHasLoaded] = useState(false)
    const { type, messageToSign } = useParams()
    const [stateStorage] = useLocalStorage({
        key: 'login_sdk',
        defaultValue: {connected_dapps: []}
    })

    const dappOrigin = new URLSearchParams(location.search).get('dappOrigin')
    const matchedDapp = stateStorage.connected_dapps.find(dapp => dapp.origin === dappOrigin)
    const { setIsBackButtonVisible } = useSDKContext()

    useEffect(() => {
        setIsBackButtonVisible(false)
    }, [setIsBackButtonVisible])

    const req = useMemo(() => {
        if (!matchedDapp) return null
        if (!type || !VALID_SIGN_METHODS.includes(type)) return null
        if (!messageToSign) return null

        return {
            id: `sdk_sign_${Date.now()}`,
            type: type,
            chainId: selectedNetwork.chainId,
            account: selectedAcc,
            txn: TYPED_DATA_METHODS.includes(type) ? JSON.parse(decodeURIComponent(messageToSign)) : messageToSign,
            dapp: {
                name: matchedDapp.name,
                url: matchedDapp.origin,
                icons: [matchedDapp.icon]
            },
            // notification: true
        }
    }, [type, messageToSign, selectedNetwork.chainId, selectedAcc, matchedDapp])

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
