import { useCallback, useEffect, useState } from 'react'
import { Yearn } from '@yfi/sdk'
import { MdInfo } from "react-icons/md"
import { ToolTip } from "components/common"

import YEARN_ICON from 'resources/yearn.svg'

const v2VaultsAddresses = { ethereum: [
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
], fantom: [
    '0x0DEC85e74A92c52b7F708c4B10207D9560CEFaf0',
    '0x695A4a6e5888934828Cb97A3a7ADbfc71A70922D',
    '0x935601c5694f23491921c14aA235c65c2ea2c4DE',
    '0x28F2fB6730d5dbeFc4FF9eB375Bbf33BcB36e774',
    '0x8b8b4018F1d1e28217A1c7432E729e58e1828D59',
    '0x2C850cceD00ce2b14AA9D658b7Cad5dF659493Db',
    '0xDf262B43bea0ACd0dD5832cf2422e0c9b2C539dc',
    '0x637eC617c86D24E421328e6CAEa1d92114892439',
    '0xdC9D3bB76Df8bE1e9Ca68C7BF32293a86C829D81',
    '0xd025b85db175EF1b175Af223BD37f330dB277786',
    '0xEF0210eB96c7EB36AF8ed1c20306462764935607',
    '0x27a5ce447f4E581aE69061E90521da4B5b298818',
    '0x42639b59cf9db5339C1C5cfB5738D0ba4F828F94',
    '0x148c05caf1Bb09B5670f00D511718f733C54bC4c',
    '0x3B9bc1f596844Ca8a30A7710Aac7155968Db7d13',
    '0x83a5Af7540E919dE74cf2D6d5F40e47f11D3E8d1',
    '0x0A0b23D9786963DE69CB2447dC125c49929419d8',
    '0x8A807b5742587024783Df3Ed2F149725C197b5eE',
    '0xD0D1f041F93c0fF1091457618E529610C67A76de',
    '0x24BC86a808D45f0AAd8008bd3ac2D9356007e833',
    '0x357ca46da26E1EefC195287ce9D838A6D5023ef3',
    '0xfF8bb7261E4D51678cB403092Ae219bbEC52aa51',
    '0xF137D22d7B23eeB1950B3e19d1f578c053ed9715',
    '0x7ff6fe5bDa1b26fa46880dF8AF844326DAd50d13',
    '0x0446acaB3e0242fCf33Aa526f1c95a88068d5042',
    '0x6EEb47BBcDf0059E5F1D6Ee844Ba793D5401bF18',
    '0xCe2Fc0bDc18BD6a4d9A725791A3DEe33F3a23BB7',
    '0x9DF9418837281faC4C4c1166f55D35F2799A9107',
    '0xd817A100AB8A29fE3DBd925c2EB489D67F758DA9',
    '0x0ed5C4effED69B39C86a8D806462d709Fb96A9E4',
    '0xD3c19eB022CAC706c898D60d756bf1535d605e1d',
    '0x35B51a621d78609dE7Cf25BC4e0682c7DEA38799',
    '0x1b48641D8251c3E84ecbe3f2bD76B3701401906D',
    '0x36A1E9dF5EfdAB9694de5bFe25A9ACc23F66BCB7',
    '0xf2d323621785A066E64282d2B407eAc79cC04966',
    '0x1e0F7D116ffB998EeC879B96698222D1Ee8d87CB',
    '0xde39F0148496D42cd4e16563463fA5C6504CaA00',
    '0x0fBbf9848D969776a5Eb842EdAfAf29ef4467698',
    '0xA36c91E38bf24E9F2df358E47D4134a8894C6a4c',
    '0xCbCaF8cB8cbeAFA927ECEE0c5C56560F83E9B7D9',
    '0xcF3b91D83cD5FE15269E6461098fDa7d69138570'	
] }

const customVaultMetadata = {
    '0xa258C4606Ca8206D8aA700cE2143D7db854D168c': {
        displayName: 'WETH',
        displayIcon: 'https://etherscan.io/token/images/weth_28.png'
    }
}

const useYearn = ({ tokens, networkDetails, provider, currentNetwork }) => {
    const [tokensItems, setTokensItems] = useState([])
    const [details, setDetails] = useState([])
    const [vaults, setVaults] = useState([])

    const getTokenFromPortfolio = useCallback(tokenAddress => tokens.find(({ address }) => address.toLowerCase() === tokenAddress.toLowerCase()) || {}, [tokens])

    const toTokensItems = useCallback((type, vaults) => {
        return vaults.map(vault => {
            let token 
            if (type === 'deposit') {
               token = vault.token
            } else {
                token = vault.yToken
            }
            const { apy } = vault
            const { address, symbol, decimals } = token
            const { balance, balanceRaw } = getTokenFromPortfolio(address)
            return {
                ...vault,
                type,
                label: `${symbol} (${apy}% APY)`,
                symbol,
                decimals,
                tokenAddress: address,
                balance: balance || 0,
                balanceRaw: balanceRaw || '0',
            }
        })
    }, [getTokenFromPortfolio])

    const loadVaults = useCallback(async () => {
        const yearn = new Yearn(networkDetails.chainId, { provider })

        const v2Vaults = await yearn.vaults.get(v2VaultsAddresses[networkDetails.id])
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



        // Prevent race conditions
        if (currentNetwork.current !== networkDetails.id) return
        setVaults(vaults)
    }, [provider, networkDetails, currentNetwork])

    const onTokenSelect = useCallback(address => {
        const selectedToken = tokensItems.find(t => t.tokenAddress === address)
        if (selectedToken) setDetails([
            [
                <>
                    <ToolTip label="Annual Percentage Yield">
                        <div>APY&nbsp;<MdInfo/></div>
                    </ToolTip>
                </>,
             `${selectedToken.apy}%`],
            ['Lock', 'No Lock'],
            ['Type', 'Variable Rate'],
        ])
    }, [tokensItems])

    useEffect(() => {
        const depositTokenItems = toTokensItems('deposit', vaults)
        const withdrawTokenItems = toTokensItems('withdraw', vaults)
        
        setTokensItems([
            ...depositTokenItems,
            ...withdrawTokenItems
        ])
        
        return () => setTokensItems([])
    }, [vaults, toTokensItems])

    return {
        icon: YEARN_ICON,
        loadVaults,
        tokensItems,
        details,
        onTokenSelect
    }
}

export default useYearn
