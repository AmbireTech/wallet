import './Providers.css'

import { RampInstantSDK } from '@ramp-network/ramp-instant-sdk'
import transakSDK from '@transak/transak-sdk'
import { popupCenter } from '../../../../../helpers/popupHelper'
import url from 'url'

import RAMP_LOGO from '../../../../../resources/ramp.svg';
import PAYTRIE_LOGO from '../../../../../resources/paytrie.svg';
import TRANSAK_LOGO from '../../../../../resources/transak.svg';
import { RAMP_HOST_API_KEY, TRANSAK_API_KEY, TRANSAK_ENV } from '../../../../../config'

const PAYTRIE_PARTNER_URL = 'https://partner.paytrie.com/?app=876454'

export default function Providers() {
    const openRampNetwork = ({ accountId, symbol }) => {
        const widget = new RampInstantSDK({
            hostAppName: 'Ambire',
            hostLogoUrl: 'https://www.ambire.com/ambire-logo.png',
            variant: 'auto',
            swapAsset: symbol,
            userAddress: accountId,
            hostApiKey: RAMP_HOST_API_KEY,
        })
        widget.show()
    };

    const openPayTrie = ({ accountId, email, symbol, ...rest }) => {
        const URL = url.parse(PAYTRIE_PARTNER_URL, true)
        URL.search = null
        URL.query = {
            ...URL.query,
            addr: accountId,
            email,
            rightSideLabel: symbol,
            ...rest,
        }
        popupCenter({
            url: url.format(URL),
            title: 'Paytrie Deposit',
            w: 450,
            h: 700,
        })
    };

    const openTransak = ({ accountId, symbol }) => {
        const transak = new transakSDK({
            apiKey: TRANSAK_API_KEY,
            environment: TRANSAK_ENV,
            cryptoCurrencyList: symbol,
            defaultCryptoCurrency: symbol,
            disableWalletAddressForm: true,
            walletAddress: accountId,
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

    const providers = [
        {
            logo: RAMP_LOGO,
            name: 'Ramp',
            type: 'Bank Transfer, Credit/Debit Card, Apple Pay',
            fees: '0.49%-2.9%',
            limits: '10,000EUR/m',
            currencies: 'USD, EUR, GBP',
            onClick: openRampNetwork
        },
        {
            logo: PAYTRIE_LOGO,
            name: 'PayTrie',
            type: 'Bank Transfer',
            fees: '1% (min. $2 CAD)',
            limits: '$2,000CAD/day',
            currencies: 'CAD',
            onClick: openPayTrie
        },
        {
            logo: TRANSAK_LOGO,
            name: 'Transak',
            type: 'Credit/Debit card and Bank Transfer (methods availability depends on location)',
            fees: 'from 0.5%',
            limits: 'up to 15,000 EUR/day',
            currencies: 'GBP, EUR, USD and many more',
            onClick: openTransak
        }
    ];

    return (
        <div id="providers">
            {
                providers.map(({ logo, name, type, fees, limits, currencies, onClick }) =>
                    <div className="provider" key={name} onClick={onClick}>
                        <div className="logo">
                            <img src={logo} alt={name}></img>
                        </div>
                        <div className="details">
                            <div className="type">
                                { type }
                            </div>
                            <div className="fees">
                                Fees: { fees }
                            </div>
                            <div className="limits">
                                Limits: { limits }
                            </div>
                            <div className="currencies">
                                Currencies: { currencies }
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    )
}