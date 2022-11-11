import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

export default function Sign(props) {
    const [hasLoaded, setHasLoaded] = useState(false)
    const { txnTo, txnValue = null,  txnData = null } = useParams()

    const showingTxDialog = useMemo(() => {
        return !!props.sendTxnState?.showing
    }, [props.sendTxnState])

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
            chainId: props.selectedNetwork.chainId,
            account: props.selectedAcc,
            txn,
            meta: null
        }
    }, [txnTo, txnValue,  txnData, props.selectedNetwork.chainId, props.selectedAcc])

    useEffect(() => {
        if (!req) return

        props.addRequest(req)
        setHasLoaded(true)
    }, [props.addRequest, req])

    useEffect(() => {
        if (hasLoaded && !showingTxDialog) {
            window.parent.postMessage({
                type: 'signClose',
            }, '*')
        }
    }, [hasLoaded, showingTxDialog])

    return (null)
}
