import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSDKContext } from 'components/SDKProvider/SDKProvider'

export default function SendTransaction({selectedAcc, selectedNetwork, addRequest, sendTxnState, internalRequests}) {
    const [hasLoaded, setHasLoaded] = useState(false)
    const showingTxDialogRef = useRef()
    const { txnTo, txnValue = null,  txnData = null } = useParams()
    const { setIsBackButtonVisible } = useSDKContext()

    useEffect(() => {
      setIsBackButtonVisible(false)
    }, [setIsBackButtonVisible])

    const showingTxDialog = useMemo(() => {
        return !!sendTxnState?.showing
    }, [sendTxnState])

    const req = useMemo(() => {
        if (!txnTo || !txnValue || !txnData) return null

        const txn = {
            to: txnTo,
            value: txnValue,
            data: txnData
        }
        return {
            id: `sdk_sign_${Date.now()}`,
            type: 'eth_sendTransaction',
            chainId: selectedNetwork.chainId,
            account: selectedAcc,
            txn,
            meta: null
        }
    }, [txnTo, txnValue,  txnData, selectedNetwork.chainId, selectedAcc])

    useEffect(() => {
        if (hasLoaded || !req) return

        addRequest(req)
        setHasLoaded(true)
    }, [hasLoaded, addRequest, req])

    useEffect(() => {
        if (hasLoaded && showingTxDialogRef.current && !showingTxDialog && internalRequests.length === 0) {
            setHasLoaded(false)
        }

        // keep prev value
        showingTxDialogRef.current = showingTxDialog
    }, [hasLoaded, showingTxDialog, internalRequests])

    return (null)
}
