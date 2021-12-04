import Card from '../Card/Card'

import YEARN_ICON from '../../../../../resources/yearn.svg'
import { useCallback, useEffect, useState } from 'react'

const yearnAPIVaults = 'https://api.yearn.finance/v1/chains/1/vaults/all'
const v2VaultsAddresses = [
    '0xdA816459F1AB5631232FE5e97a05BBBb94970c95',
    '0xa354F35829Ae975e850e23e9615b11Da1B3dC4DE',
    '0xdb25cA703181E7484a155DD612b06f57E12Be5F0',
    '0xdA816459F1AB5631232FE5e97a05BBBb94970c95',
    '0xA696a63cc78DfFa1a63E9E50587C197387FF6C7E',
    '0x7Da96a3891Add058AdA2E826306D812C638D87a7',
    '0xB8C3B7A2A618C552C23B1E4701109a9E756Bab67',
    '0xe11ba472F74869176652C35D30dB89854b5ae84D',
    '0xa9fE4601811213c340e850ea305481afF02f5b28',
    '0xFBEB78a723b8087fD2ea7Ef1afEc93d35E8Bed42',
    '0x6d765CbE5bC922694afE112C140b8878b9FB0390',
    '0xFD0877d9095789cAF24c98F7CCe092fa8E120775',
    '0xd9788f3931Ede4D5018184E198699dC6d66C1915',
]

const YearnCard = ({ networkId, tokens }) => {
    const unavailable = networkId !== 'ethereum'
    const [tokensItems, setTokensItems] = useState([])
    const [details, setDetails] = useState([])

    const getTokenFromPortfolio = tokenAddress => tokens.find(({ address }) => address.toLowerCase() === tokenAddress.toLowerCase()) || {}

    const loadVaults = useCallback(async () => {
        const response = await fetch(yearnAPIVaults)
        const allVaults = await response.json()
        const v2Vaults = allVaults.filter(({ type, address }) => type === 'v2' && v2VaultsAddresses.includes(address))

        const vaults = v2Vaults.map(({ address, apy, symbol, token, decimals }) => ({
            apr: apy.gross_apr.toFixed(2),
            token,
            yToken: {
                address,
                symbol,
                decimals
            }
        }))

        const depositTokens = vaults.map(({ apr, token }) => {
            const { address, icon, symbol, decimals } = token
            const { balance, balanceRaw } = getTokenFromPortfolio(address)
            return {
                type: 'deposit',
                icon,
                label: `${symbol} (${apr}% APR)`,
                value: address,
                symbol,
                decimals,
                apr,
                balance: balance || 0,
                balanceRaw: balanceRaw || '0',
            }
        })

        const withdrawTokens = vaults.map(({ apr, yToken, token }) => {
            const { address, symbol, decimals } = yToken
            const { balance, balanceRaw } = getTokenFromPortfolio(address)
            return {
                type: 'withdraw',
                icon: token.icon,
                label: `${symbol} (${apr}% APR)`,
                value: address,
                symbol,
                decimals,
                apr,
                balance: balance || 0,
                balanceRaw: balanceRaw || '0',
            }
        })

        setTokensItems([
            ...depositTokens,
            ...withdrawTokens
        ].sort((a, b) => b.apr - a.apr))
    }, [tokens])

    const onTokenSelect = useCallback(address => {
        const selectedToken = tokensItems.find(t => t.value === address)
        if (selectedToken) setDetails([
            ['Annual Percentage Rate (APR)', `${selectedToken.apr}%`],
            ['Lock', 'No Lock'],
            ['Type', 'Variable Rate'],
        ])
    }, [tokensItems])

    useEffect(() => loadVaults(), [loadVaults])

    return (
        <Card
            icon={YEARN_ICON}
            unavailable={unavailable}
            tokensItems={tokensItems}
            details={details}
            onTokenSelect={onTokenSelect}
        />
    )
}

export default YearnCard