import { RampInstantSDK } from '@ramp-network/ramp-instant-sdk'
import transakSDK from '@transak/transak-sdk'
import { popupCenter } from 'lib/popupHelper'
import { fetchGet } from 'lib/fetch'
import { useState } from 'react';
import { useToasts } from 'hooks/toasts'

import url from 'url'

import { RAMP_HOST_API_KEY, PAYTRIE_PARTNER_URL, TRANSAK_API_KEY, TRANSAK_ENV } from 'config'

const useProviders = ({ walletAddress, selectedNetwork, relayerURL }) => {

    const [isLoading, setLoading] = useState([])
    const { addToast } = useToasts()

    const openRampNetwork = () => {
        const assetsList = {
            ethereum: 'ERC20_*,ETH_*',
            polygon: 'MATIC_ERC20_*,MATIC_*',
            avalanche: 'AVAX_*',
            'binance-smart-chain': 'BSC_*,BSC_ERC20_*',
        }

        const widget = new RampInstantSDK({
            hostAppName: 'Ambire',
            hostLogoUrl: 'https://www.ambire.com/ambire-logo.png',
            variant: 'auto',
            swapAsset: assetsList[selectedNetwork],
            userAddress: walletAddress,
            hostApiKey: RAMP_HOST_API_KEY,
        })
        widget.show()
    };
    
    const openPayTrie = async() => {
        setLoading(prevState => ['PayTrie', ...prevState])
        const rightSideLabels = {
            ethereum: 'USDC',
            polygon: 'USDC-P',
            'binance-smart-chain': 'USDT-B',
        }

        const URL = url.parse(PAYTRIE_PARTNER_URL, true)
        URL.search = null
        URL.query = {
            ...URL.query,
            addr: walletAddress,
            rightSideLabel: rightSideLabels[selectedNetwork]
        }

        popupCenter({
            url: url.format(URL),
            title: 'Paytrie Deposit',
            w: 450,
            h: 700,
        })
        setLoading(prevState => prevState.filter(n => n !== 'PayTrie'))
    };

    const openTransak = () => {
        const networksAlias = {
            'avalanche': 'avaxcchain',
            'binance-smart-chain': 'bsc',
            'moonbeam': 'mainnet'
        }

        const defaultCurency = {
            'ethereum': 'USDC',
            'polygon': 'USDC',
            'arbitrum': 'ETH',
            'avalanche': 'AVAX',
            'binance-smart-chain': 'BNB',
            'moonriver': 'MOVR',
            'moonbeam': 'GLMR',
            'optimism': 'USDC'
        }

        const transak = new transakSDK({
            apiKey: TRANSAK_API_KEY,
            environment: TRANSAK_ENV,
            networks: networksAlias[selectedNetwork] || selectedNetwork,
            defaultCryptoCurrency: defaultCurency[selectedNetwork],
            disableWalletAddressForm: true,
            walletAddress,
            themeColor: '282b33',
            email: '',
            redirectURL: '',
            hostURL: window.location.origin,
            widgetHeight: 'calc(100% - 60px)',
            widgetWidth: '100%',
        })

        transak.init()

        transak.on(transak.ALL_EVENTS, data => {
            console.log(data)
        })

        transak.on(transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, orderData => {
            console.log(orderData)
            transak.close()
        })
    }


    const openKriptomat = async () => {
        setLoading(prevState => ['Kriptomat', ...prevState])
        const kriptomatResponse = await fetchGet(`${relayerURL}/kriptomat/${walletAddress}/${selectedNetwork}`)
        if (kriptomatResponse.success && kriptomatResponse.data && kriptomatResponse.data.url) popupCenter({
            url: url.format(kriptomatResponse.data.url),
            title: 'Kriptomat Deposit',
            w: 515,
            h: 600
        })
        else addToast(`Error: ${kriptomatResponse.data ? kriptomatResponse.data : 'unexpected error'}`, { error: true })
        setLoading(prevState => prevState.filter(n => n !== 'Kriptomat'))
    }


    return {
        openRampNetwork,
        openPayTrie,
        openTransak,
        openKriptomat,
        isLoading
    }
}

export default useProviders