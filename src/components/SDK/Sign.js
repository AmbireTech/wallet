import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'

export default function Sign(props) {
    const { txnTo, txnValue = null,  txnData = null } = useParams()

    const req = useMemo(() => {
        if (!txnTo || !txnValue || !txnData) return null

        const txn = {
            to: txnTo,
            value: txnValue,
            data: txnData
        }
        return {
            id: `transfer_${Date.now()}`,
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
    }, [req])

    return (null)
}
