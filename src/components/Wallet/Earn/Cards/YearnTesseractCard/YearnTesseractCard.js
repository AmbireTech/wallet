import Card from '../../Card/Card'

import { useEffect, useState, useMemo, useRef } from 'react'
import { Interface, parseUnits } from 'ethers/lib/utils'
import { getDefaultProvider } from '@ethersproject/providers'
import networks from '../../../../../consts/networks'
import YEARN_TESSERACT_VAULT_ABI from '../../../../../consts/YearnTesseractVaultABI'
import useYearn from './useYearn'
import useTesseract from './useTesseract'
import { useToasts } from '../../../../../hooks/toasts'
import approveToken from '../../../../../lib/approveToken'

const VaultInterface = new Interface(YEARN_TESSERACT_VAULT_ABI)

const YearnTesseractCard = ({ networkId, accountId, tokens, addRequest }) => {
    const { addToast } = useToasts()

    const currentNetwork = useRef()
    const [loading, setLoading] = useState([])

    const unavailable = !(networkId === 'ethereum' || networkId === 'polygon')
    const name = networkId === 'ethereum' ? 'Yearn' : 'Tesseract'
    const networkDetails = networks.find(({ id }) => id === networkId)
    const addRequestTxn = (id, txn, extraGas = 0) => addRequest({ id, type: 'eth_sendTransaction', chainId: networkDetails.chainId, account: accountId, txn, extraGas })
    const provider = useMemo(() => getDefaultProvider(networkDetails.rpc), [networkDetails.rpc])

    const yearn = useYearn({
        tokens,
        provider,
        networkDetails,
        currentNetwork
    })

    const tesseract = useTesseract({
        tokens,
        provider,
        networkId,
        currentNetwork
    })

    const { icon, loadVaults, tokensItems, details, onTokenSelect } = useMemo(() => networkId === 'ethereum' ? yearn : tesseract, [networkId, yearn, tesseract])

    const onValidate = async (type, value, amount) => {
        const item = tokensItems.find(t => t.type === type.toLowerCase() && t.value === value)
        if (!item) return

        const { vaultAddress, decimals } = item
        const parsedAmount = amount.slice(0, amount.indexOf('.') + Number(decimals) + 1);
        const bigNumberAmount = parseUnits(parsedAmount, decimals)

        if (type === 'Deposit') {
            await approveToken(name, networkId, accountId, vaultAddress, item.tokenAddress, addRequestTxn, addToast)

            try {
                addRequestTxn(`${name.toLowerCase()}_vault_deposit_${Date.now()}`, {
                    to: vaultAddress,
                    value: '0x0',
                    data: VaultInterface.encodeFunctionData('deposit', [bigNumberAmount.toHexString(), accountId])
                })
            } catch(e) {
                console.error(e)
                addToast(`${name} Deposit Error: ${e.message || e}`, { error: true })
            }
        } else if (type === 'Withdraw') {
            try {
                addRequestTxn(`${name.toLowerCase()}_vault_withdraw_${Date.now()}`, {
                    to: vaultAddress,
                    value: '0x0',
                    data: VaultInterface.encodeFunctionData('withdraw', [bigNumberAmount.toHexString(), accountId])
                })
            } catch(e) {
                console.error(e)
                addToast(`${name} Withdraw Error: ${e.message || e}`, { error: true })
            }
        }
    }

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