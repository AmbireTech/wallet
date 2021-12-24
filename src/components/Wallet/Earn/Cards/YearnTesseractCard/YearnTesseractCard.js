import Card from '../../Card/Card'

import { useEffect, useState, useMemo, useRef } from 'react'
import { getDefaultProvider } from '@ethersproject/providers'
import networks from '../../../../../consts/networks'
import useYearn from './useYearn'
import useTesseract from './useTesseract'

const YearnTesseractCard = ({ networkId, accountId, tokens, addRequest }) => {
    const currentNetwork = useRef()
    const [loading, setLoading] = useState([])

    const unavailable = !(networkId === 'ethereum' || networkId === 'polygon')
    const networkDetails = networks.find(({ id }) => id === networkId)
    const addRequestTxn = (id, txn, extraGas = 0) => addRequest({ id, type: 'eth_sendTransaction', chainId: networkDetails.chainId, account: accountId, txn, extraGas })
    const provider = useMemo(() => getDefaultProvider(networkDetails.rpc), [networkDetails.rpc])

    const yearn = useYearn({
        tokens,
        provider,
        networkDetails,
        currentNetwork,
        accountId,
        addRequestTxn
    })

    const tesseract = useTesseract({
        tokens,
        provider,
        networkId,
        currentNetwork,
        accountId,
        addRequestTxn
    })

    const { icon, loadVaults, tokensItems, details, onTokenSelect, onValidate } = useMemo(() => networkId === 'ethereum' ? yearn : tesseract, [networkId, yearn, tesseract])

    useEffect(() => {
        if (unavailable) return setLoading(false)
        async function load() {
            await loadVaults()
            setLoading(false)
        }
        load()
    }, [unavailable, loadVaults])

    useEffect(() => {
        currentNetwork.current = networkId
        setLoading(true)
    }, [networkId])

    return (
        <Card
            loading={loading}
            icon={icon}
            unavailable={unavailable}
            tokensItems={tokensItems}
            details={details}
            onTokenSelect={onTokenSelect}
            onValidate={onValidate}
        />
    )
}

export default YearnTesseractCard