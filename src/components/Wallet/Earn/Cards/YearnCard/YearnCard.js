import Card from '../Card/Card'

import { useCallback, useEffect, useState, useMemo, useRef } from 'react'
import { parseUnits } from '@ethersproject/units'
import { Interface } from '@ethersproject/abi'
import { Yearn } from '@yfi/sdk'
import YEARN_VAULT_ABI from '../../../../../consts/YearnVaultABI'
import networks from '../../../../../consts/networks'
import { useToasts } from '../../../../../hooks/toasts'
import YEARN_ICON from '../../../../../resources/yearn.svg'
import approveToken from '../../../../../lib/approveToken'
import { getProvider } from '../../../../../lib/provider'

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

const customVaultMetadata = {
    '0xa258C4606Ca8206D8aA700cE2143D7db854D168c': {
        displayName: 'WETH',
        displayIcon: 'https://etherscan.io/token/images/weth_28.png'
    }
}

const YearnVaultInterface = new Interface(YEARN_VAULT_ABI)

const YearnCard = ({ networkId, accountId, tokens, addRequest }) => {
    const { addToast } = useToasts()

    const currentNetwork = useRef()
    const [loading, setLoading] = useState([])
    const [tokensItems, setTokensItems] = useState([])
    const [details, setDetails] = useState([])

    const unavailable = networkId !== 'ethereum'
    const networkDetails = networks.find(({ id }) => id === networkId)
    const getTokenFromPortfolio = useCallback(tokenAddress => tokens.find(({ address }) => address.toLowerCase() === tokenAddress.toLowerCase()) || {}, [tokens])
    const addRequestTxn = (id, txn, extraGas = 0) => addRequest({ id, type: 'eth_sendTransaction', chainId: networkDetails.chainId, account: accountId, txn, extraGas })
    const provider = useMemo(() => getProvider(networkDetails.id), [networkDetails.id])

    const loadVaults = useCallback(async () => {
        if (unavailable) return
    
        const yearn = new Yearn(networkDetails.chainId, { provider })

        const v2Vaults = await yearn.vaults.get(v2VaultsAddresses)
        const vaults = v2Vaults.map(({ address, metadata, symbol, token, decimals }) => {
            const { apy, displayName, displayIcon} = {
                ...metadata,
                ...customVaultMetadata[address] || {}
            }
            const formattedAPY = (apy?.net_apy * 100).toFixed(2) || 0

            return {
                vaultAddress: address,
                apy: formattedAPY,
                icon: displayIcon,
                value: address,
                token: {
                    address: token,
                    symbol: displayName,
                    decimals
                },
                yToken: {
                    address,
                    symbol,
                    decimals
                }
            }
        })

        const depositTokens = vaults.map(vault => {
            const { apy, token } = vault
            const { address, symbol, decimals } = token
            const { balance, balanceRaw } = getTokenFromPortfolio(address)
            return {
                ...vault,
                type: 'deposit',
                label: `${symbol} (${apy}% APY)`,
                symbol,
                decimals,
                tokenAddress: token.address,
                balance: balance || 0,
                balanceRaw: balanceRaw || '0',
            }
        })

        const withdrawTokens = vaults.map(vault => {
            const { apy, yToken } = vault
            const { address, symbol, decimals } = yToken
            const { balance, balanceRaw } = getTokenFromPortfolio(address)
            return {
                ...vault,
                type: 'withdraw',
                label: `${symbol} (${apy}% APY)`,
                symbol,
                decimals,
                tokenAddress: yToken.address,
                balance: balance || 0,
                balanceRaw: balanceRaw || '0',
            }
        })

        // Prevent race conditions
        if (currentNetwork.current !== networkDetails.id) return

        setTokensItems([
            ...depositTokens,
            ...withdrawTokens
        ])
    }, [getTokenFromPortfolio, provider, networkDetails, unavailable])

    const onTokenSelect = useCallback(address => {
        const selectedToken = tokensItems.find(t => t.tokenAddress === address)
        if (selectedToken) setDetails([
            ['Annual Percentage Yield (APY)', `${selectedToken.apy}%`],
            ['Lock', 'No Lock'],
            ['Type', 'Variable Rate'],
        ])
    }, [tokensItems])

    const onValidate = async (type, value, amount) => {
        const item = tokensItems.find(t => t.type === type.toLowerCase() && t.value === value)
        if (!item) return

        const { vaultAddress, decimals } = item
        const parsedAmount = amount.slice(0, amount.indexOf('.') + Number(decimals) + 1);
        const bigNumberAmount = parseUnits(parsedAmount, decimals)

        if (type === 'Deposit') {
            await approveToken('Yearn Vault', networkId, accountId, vaultAddress, item.tokenAddress, addRequestTxn, addToast)

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
                addRequestTxn(`yearn_vault_withdraw_${Date.now()}`, {
                    to: vaultAddress,
                    value: '0x0',
                    data: YearnVaultInterface.encodeFunctionData('withdraw', [bigNumberAmount.toHexString(), accountId])
                })
            } catch(e) {
                console.error(e)
                addToast(`Yearn Withdraw Error: ${e.message || e}`, { error: true })
            }
        }
    }

    useEffect(() => {
        async function load() {
            await loadVaults()
            setLoading(false)
        }
        load()
    }, [loadVaults])

    useEffect(() => {
        currentNetwork.current = networkId
        setLoading(true)
    }, [networkId])

    return (
        <Card
            loading={loading}
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