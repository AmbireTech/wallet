import Card from '../Card/Card'

import { useCallback, useEffect, useState, useMemo } from 'react'
import { ethers } from 'ethers'
import { parseUnits } from '@ethersproject/units'
import { Contract } from '@ethersproject/contracts'
import { getDefaultProvider } from '@ethersproject/providers'
import { Interface } from '@ethersproject/abi'
import ERC20ABI from 'adex-protocol-eth/abi/ERC20.json'
import { Yearn } from '@yfi/sdk'
import YEARN_VAULT_ABI from '../../../../../consts/YearnVaultABI'
import networks from '../../../../../consts/networks'
import { useToasts } from '../../../../../hooks/toasts'
import YEARN_ICON from '../../../../../resources/yearn.svg'

const v2VaultsAddresses = [
    '0xdA816459F1AB5631232FE5e97a05BBBb94970c95',
    '0xa354F35829Ae975e850e23e9615b11Da1B3dC4DE',
    '0xdb25cA703181E7484a155DD612b06f57E12Be5F0',
    '0xA696a63cc78DfFa1a63E9E50587C197387FF6C7E',
    '0x7Da96a3891Add058AdA2E826306D812C638D87a7',
    '0xB8C3B7A2A618C552C23B1E4701109a9E756Bab67',
    '0xe11ba472F74869176652C35D30dB89854b5ae84D',
    '0xa258C4606Ca8206D8aA700cE2143D7db854D168c',
    '0xFBEB78a723b8087fD2ea7Ef1afEc93d35E8Bed42',
    '0x6d765CbE5bC922694afE112C140b8878b9FB0390',
    '0xFD0877d9095789cAF24c98F7CCe092fa8E120775',
    '0xd9788f3931Ede4D5018184E198699dC6d66C1915',
]

const ERC20Interface = new Interface(ERC20ABI)
const YearnVaultInterface = new Interface(YEARN_VAULT_ABI)

const YearnCard = ({ networkId, accountId, tokens, addRequest }) => {
    const { addToast } = useToasts()

    const [tokensItems, setTokensItems] = useState([])
    const [details, setDetails] = useState([])

    const unavailable = networkId !== 'ethereum'
    const currentNetwork = networks.find(({ id }) => id === networkId)
    const getTokenFromPortfolio = useCallback(tokenAddress => tokens.find(({ address }) => address.toLowerCase() === tokenAddress.toLowerCase()) || {}, [tokens])
    const addRequestTxn = (id, txn, extraGas = 0) => addRequest({ id, type: 'eth_sendTransaction', chainId: currentNetwork.chainId, account: accountId, txn, extraGas })
    const provider = useMemo(() => getDefaultProvider(currentNetwork.rpc), [currentNetwork.rpc])

    const loadVaults = useCallback(async () => {
        const yearn = new Yearn(currentNetwork.chainId, { provider })

        const v2Vaults = await yearn.vaults.get(v2VaultsAddresses)
        const vaults = v2Vaults.map(({ address, metadata, symbol, token, decimals }) => ({
            vaultAddress: address,
            apr: metadata.apy.gross_apr.toFixed(2),
            token: {
                address: token,
                icon: metadata.displayIcon,
                symbol: metadata.displayName,
                decimals
            },
            yToken: {
                address,
                symbol,
                decimals
            }
        }))

        const depositTokens = vaults.map(({ vaultAddress, apr, token }) => {
            const { address, icon, symbol, decimals } = token
            const { balance, balanceRaw } = getTokenFromPortfolio(address)
            return {
                type: 'deposit',
                icon,
                label: `${symbol} (${apr}% APR)`,
                value: address,
                symbol,
                decimals,
                tokenAddress: address,
                vaultAddress,
                apr,
                balance: balance || 0,
                balanceRaw: balanceRaw || '0',
            }
        })

        const withdrawTokens = vaults.map(({ vaultAddress, apr, yToken, token }) => {
            const { address, symbol, decimals } = yToken
            const { balance, balanceRaw } = getTokenFromPortfolio(address)
            return {
                type: 'withdraw',
                icon: token.icon,
                label: `${symbol} (${apr}% APR)`,
                value: address,
                symbol,
                decimals,
                tokenAddress: address,
                vaultAddress,
                apr,
                balance: balance || 0,
                balanceRaw: balanceRaw || '0',
            }
        })

        setTokensItems([
            ...depositTokens,
            ...withdrawTokens
        ])
    }, [getTokenFromPortfolio, provider, currentNetwork.chainId])

    const onTokenSelect = useCallback(address => {
        const selectedToken = tokensItems.find(t => t.value === address)
        if (selectedToken) setDetails([
            ['Annual Percentage Rate (APR)', `${selectedToken.apr}%`],
            ['Lock', 'No Lock'],
            ['Type', 'Variable Rate'],
        ])
    }, [tokensItems])

    const approveToken = async (vaultAddress, tokenAddress, bigNumberHexAmount) => {
        try {
            const tokenContract = new Contract(tokenAddress, ERC20Interface, provider)
            const allowance = await tokenContract.allowance(accountId, vaultAddress)

            if (allowance.lt(bigNumberHexAmount)) {
                addRequestTxn(`yearn_vault_approve_${Date.now()}`, {
                    to: tokenAddress,
                    value: '0x0',
                    data: ERC20Interface.encodeFunctionData('approve', [vaultAddress, bigNumberHexAmount])
                })
            }
        } catch(e) {
            console.error(e)
            addToast(`Yearn Approve Error: ${e.message || e}`, { error: true })
        }
    }

    const onValidate = async (type, tokenAddress, amount) => {
        const token = tokensItems.find(t => t.tokenAddress === tokenAddress)
        if (!token) return

        const { vaultAddress, decimals } = token
        const bigNumberAmount = parseUnits(amount.toString(), decimals)

        if (type === 'Deposit') {
            await approveToken(vaultAddress, tokenAddress, ethers.constants.MaxUint256)

            try {
                addRequestTxn(`yearn_vault_deposit_${Date.now()}`, {
                    to: vaultAddress,
                    value: '0x0',
                    data: YearnVaultInterface.encodeFunctionData('deposit', [bigNumberAmount.toHexString(), accountId])
                })
            } catch(e) {
                console.error(e)
                addToast(`Yearn Deposit Error: ${e.message || e}`, { error: true })
            }
        } else if (type === 'Withdraw') {
            try {
                const vaultContract = new Contract(vaultAddress, YearnVaultInterface, provider)
                const pricePerShare = await vaultContract.pricePerShare()
                const sharesAmount = parseUnits((bigNumberAmount.toNumber() / pricePerShare.toNumber()).toFixed(decimals), decimals)

                addRequestTxn(`yearn_vault_withdraw_${Date.now()}`, {
                    to: vaultAddress,
                    value: '0x0',
                    data: YearnVaultInterface.encodeFunctionData('withdraw', [sharesAmount.toHexString(), accountId])
                })
            } catch(e) {
                console.error(e)
                addToast(`Yearn Withdraw Error: ${e.message || e}`, { error: true })
            }
        }
    }

    useEffect(() => loadVaults(), [loadVaults])

    return (
        <Card
            icon={YEARN_ICON}
            unavailable={unavailable}
            tokensItems={tokensItems}
            details={details}
            onTokenSelect={onTokenSelect}
            onValidate={onValidate}
        />
    )
}

export default YearnCard