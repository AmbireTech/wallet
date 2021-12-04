import { RampInstantSDK } from '@ramp-network/ramp-instant-sdk'
import transakSDK from '@transak/transak-sdk'
import { popupCenter } from '../helpers/popupHelper'
import url from 'url'

import { RAMP_HOST_API_KEY, PAYTRIE_PARTNER_URL, TRANSAK_API_KEY, TRANSAK_ENV } from '../config'

export const openRampNetwork = ({ walletAddress, selectedNetwork }) => {
    const assetsList = {
        ethereum: 'ERC20_*,ETH_*',
        polygon: 'MATIC_ERC20_*,MATIC_*',
        avalanche: 'AVAX_*',
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

export const openPayTrie = ({ walletAddress, selectedNetwork }) => {
    const rightSideLabel = selectedNetwork === 'polygon' ? 'USDC-P' : 'USDC'

    const URL = url.parse(PAYTRIE_PARTNER_URL, true)
    URL.search = null
    URL.query = {
        ...URL.query,
        addr: walletAddress,
        rightSideLabel
    }

    popupCenter({
        url: url.format(URL),
        title: 'Paytrie Deposit',
        w: 450,
        h: 700,
    })
};

export const openTransak = ({ walletAddress, selectedNetwork }) => {
    let networks = selectedNetwork === 'avalanche' ? 'avaxcchain' : selectedNetwork
    let defaultCurency = {
        'ethereum': 'USDC',
        'polygon': 'USDC',
        'arbitrum': 'ETH',
        'avaxcchain': 'AVAX'
    }

    const transak = new transakSDK({
        apiKey: TRANSAK_API_KEY,
        environment: TRANSAK_ENV,
        networks,
        defaultCryptoCurrency: defaultCurency[networks],
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
