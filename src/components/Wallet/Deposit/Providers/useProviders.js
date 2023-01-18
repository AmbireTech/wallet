import { RampInstantSDK } from '@ramp-network/ramp-instant-sdk'
import transakSDK from '@transak/transak-sdk'
import { popupCenter } from 'lib/popupHelper'
import { fetchGet } from 'lib/fetch'
import { useState } from 'react';
import { useToasts } from 'hooks/toasts'
import { useModals } from 'hooks'
import GuardarianDepositProviderModal from 'components/Modals/GuardarianDepositProviderModal/GuardarianDepositProviderModal'
import { useHistory } from 'react-router-dom'

import url from 'url'

import { RAMP_HOST_API_KEY, PAYTRIE_PARTNER_URL, TRANSAK_API_KEY, TRANSAK_ENV } from 'config'

const useProviders = ({ walletAddress, selectedNetwork, relayerURL, portfolio }) => {
    const history = useHistory()
    const [isLoading, setLoading] = useState([])
    const { addToast } = useToasts()
    const { showModal } = useModals()

    const openRampNetwork = () => {
        const assetsList = {
            'ethereum': 'ERC20_*,ETH_*',
            'polygon': 'MATIC_ERC20_*,MATIC_*',
            'avalanche': 'AVAX_*',
            'binance-smart-chain': 'BSC_*,BSC_ERC20_*',
            'gnosis': 'XDAI_*'
        }

        const widget = new RampInstantSDK({
            hostAppName: 'Ambire',
            hostLogoUrl: 'https://raw.githubusercontent.com/AmbireTech/ambire-brand/main/logos/Ambire%20Horizontal%20Light%20Background.svg',
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

    const openGuardarian = (initMode = 'buy', selectedAsset) => {
        setLoading(prevState => ['Guardarian', ...prevState])
        showModal(<GuardarianDepositProviderModal relayerURL={relayerURL} walletAddress={walletAddress} selectedNetwork={selectedNetwork} portfolio={portfolio} initMode={initMode} selectedAsset={selectedAsset}/>)
        setLoading(prevState => prevState.filter(n => n !== 'Guardarian'))
    }

    const openMoonpay = async (mode = 'buy', selectedAsset) => {
        setLoading(prevState => ['MoonPay', ...prevState])
        const moonpayResponse = await fetchGet(`${relayerURL}/moonpay/${walletAddress}/${mode}/${selectedAsset ? selectedAsset.symbol : null}`)
        
        if (moonpayResponse.success && moonpayResponse.data && moonpayResponse.data.url) popupCenter({
            url: url.format(moonpayResponse.data.url),
            title: 'MoonPay Deposit',
            w: 515,
            h: 600
        })
        else addToast(`Error: ${moonpayResponse.data ? moonpayResponse.data : 'unexpected error'}`, { error: true })
        setLoading(prevState => prevState.filter(n => n !== 'MoonPay'))
    }

    const openSwappin = async () => {
        setLoading(prevState => ['Swappin', ...prevState])
        const url = 'https://app.swappin.gifts/ref/ambire'
        history.push(`/wallet/dapps?dappUrlCatalog=${url}`)
        setLoading(prevState => prevState.filter(n => n !== 'Swappin'))
    }

    return {
        openRampNetwork,
        openPayTrie,
        openTransak,
        openKriptomat,
        openGuardarian,
        openMoonpay,
        openSwappin,
        isLoading
    }
}

export default useProviders