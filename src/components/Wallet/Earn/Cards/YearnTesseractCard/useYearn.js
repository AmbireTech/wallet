import { useCallback, useState } from 'react'
import { Yearn } from '@yfi/sdk'

import YEARN_ICON from 'resources/yearn.svg'

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

const useYearn = ({ tokens, networkDetails, provider, currentNetwork }) => {
    const [tokensItems, setTokensItems] = useState([])
    const [details, setDetails] = useState([])

    const getTokenFromPortfolio = useCallback(tokenAddress => tokens.find(({ address }) => address.toLowerCase() === tokenAddress.toLowerCase()) || {}, [tokens])

    const loadVaults = useCallback(async () => {
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
    }, [getTokenFromPortfolio, provider, networkDetails, currentNetwork])

    const onTokenSelect = useCallback(address => {
        const selectedToken = tokensItems.find(t => t.tokenAddress === address)
        if (selectedToken) setDetails([
            ['Annual Percentage Yield (APY)', `${selectedToken.apy}%`],
            ['Lock', 'No Lock'],
            ['Type', 'Variable Rate'],
        ])
    }, [tokensItems])

    return {
        icon: YEARN_ICON,
        loadVaults,
        tokensItems,
        details,
        onTokenSelect
    }
}

export default useYearn