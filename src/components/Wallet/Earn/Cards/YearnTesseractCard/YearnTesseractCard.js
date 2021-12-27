import Card from '../../Card/Card'

import { useEffect, useState, useMemo, useRef } from 'react'
import { constants, Contract } from 'ethers'
import { Interface, parseUnits } from 'ethers/lib/utils'
import { getDefaultProvider } from '@ethersproject/providers'
import networks from '../../../../../consts/networks'
import ERC20ABI from 'adex-protocol-eth/abi/ERC20.json'
import YEARN_VAULT_ABI from '../../../../../consts/YearnVaultABI'
import TESSERACT_VAULT_ABI from '../../../../../consts/TesseractVaultABI'
import useYearn from './useYearn'
import useTesseract from './useTesseract'
import { useToasts } from '../../../../../hooks/toasts'

const ERC20Interface = new Interface(ERC20ABI)
const YearnVaultInterface = new Interface(YEARN_VAULT_ABI)
const TesseractVaultInterface = new Interface(TESSERACT_VAULT_ABI)

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

    const approveToken = async (vaultAddress, tokenAddress, bigNumberHexAmount) => {
        try {
            const tokenContract = new Contract(tokenAddress, ERC20Interface, provider)
            const allowance = await tokenContract.allowance(accountId, vaultAddress)

            if (allowance.lt(bigNumberHexAmount)) {
                addRequestTxn(`${name.toLowerCase()}_vault_approve_${Date.now()}`, {
                    to: tokenAddress,
                    value: '0x0',
                    data: ERC20Interface.encodeFunctionData('approve', [vaultAddress, bigNumberHexAmount])
                })
            }
        } catch(e) {
            console.error(e)
            addToast(`${name} Approve Error: ${e.message || e}`, { error: true })
        }
    }

    const onValidate = async (type, value, amount) => {
        const item = tokensItems.find(t => t.type === type.toLowerCase() && t.value === value)
        if (!item) return

        const { vaultAddress, decimals } = item
        const parsedAmount = amount.slice(0, amount.indexOf('.') + Number(decimals) + 1);
        const bigNumberAmount = parseUnits(parsedAmount, decimals)

        const vaultInterface = networkId === 'ethereum' ? YearnVaultInterface : TesseractVaultInterface

        if (type === 'Deposit') {
            await approveToken(vaultAddress, item.tokenAddress, constants.MaxUint256)

            try {
                addRequestTxn(`${name.toLowerCase()}_vault_deposit_${Date.now()}`, {
                    to: vaultAddress,
                    value: '0x0',
                    data: vaultInterface.encodeFunctionData('deposit', [bigNumberAmount.toHexString(), accountId])
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
                    data: vaultInterface.encodeFunctionData('withdraw', [bigNumberAmount.toHexString(), accountId])
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