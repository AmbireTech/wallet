import { RampInstantSDK } from '@ramp-network/ramp-instant-sdk'
import transakSDK from '@transak/transak-sdk'
import { popupCenter } from '../helpers/popupHelper'
import url from 'url'

import { RAMP_HOST_API_KEY, TRANSAK_API_KEY, TRANSAK_ENV } from '../config'

const PAYTRIE_PARTNER_URL = 'https://partner.paytrie.com/?app=876454'

export const openRampNetwork = ({ walletAddress }) => {
    const widget = new RampInstantSDK({
        hostAppName: 'Ambire',
        hostLogoUrl: 'https://www.ambire.com/ambire-logo.png',
        variant: 'auto',
        swapAsset: 'USDC',
        userAddress: walletAddress,
        hostApiKey: RAMP_HOST_API_KEY,
    })
    widget.show()
};

export const openPayTrie = ({ walletAddress, email, ...rest }) => {
    const URL = url.parse(PAYTRIE_PARTNER_URL, true)
    URL.search = null
    URL.query = {
        ...URL.query,
        addr: walletAddress,
        email,
        rightSideLabel: 'USDC',
        ...rest,
    }
    popupCenter({
        url: url.format(URL),
        title: 'Paytrie Deposit',
        w: 450,
        h: 700,
    })
};

export const openTransak = ({ walletAddress }) => {
    const transak = new transakSDK({
        apiKey: TRANSAK_API_KEY,
        environment: TRANSAK_ENV,
        cryptoCurrencyList: 'USDC',
        defaultCryptoCurrency: 'USDC',
        disableWalletAddressForm: true,
        walletAddress: walletAddress,
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