
import RAMP_LOGO from 'resources/payment-providers/ramp.svg';
import PAYTRIE_LOGO from 'resources/payment-providers/paytrie.svg';
import TRANSAK_LOGO from 'resources/payment-providers/transak.svg';
// import KRIPTOMAT_LOGO from 'resources/payment-providers/kriptomat.svg';
import GUARDARIAN_LOGO from 'resources/payment-providers/guardarian.svg'
import SWAPPIN_LOGO from 'resources/payment-providers/swappin.svg'
// import MOONPAY_LOGO from 'resources/payment-providers/moonpay.svg'

import { Loading, Info } from 'components/common'
import useProviders from './useProviders'

import styles from './Providers.module.scss'

export default function Providers({ walletAddress, networkDetails, relayerURL, portfolio,  sellMode = false, selectedAsset }) {
    const { openRampNetwork, openPayTrie, openTransak, openGuardarian, openSwappin, isLoading } = useProviders({ walletAddress, selectedNetwork: networkDetails.id, relayerURL, portfolio }) // openKriptomat
    const initMode = sellMode ? 'sell' : 'buy'
    const providers = [
        {
            logo: GUARDARIAN_LOGO,
            name: 'Guardarian',
            type: 'Buy with Bank Transfer, Credit/Debit Card, Sell Crypto',
            fees: 'from 2%',
            limits: 'up to 15k EUR/monthly on and off ramp',
            currencies: 'GBP, EUR, USD and many more',
            networks: ['ethereum', 'polygon', 'binance-smart-chain', 'fantom'],
            isSellAvailable: true,
            isBuyAvailable: true,
            onClick: () => openGuardarian(initMode, selectedAsset)
        },
        // DISABLED: Temporary until maintenance ends.
        // {
        //     logo: KRIPTOMAT_LOGO,
        //     name: 'Kriptomat',
        //     type: 'Credit Card',
        //     fees: '2.45%',
        //     limits: 'up to 5000 EUR/day',
        //     currencies: 'USD, EUR, GBP',
        //     networks: ['ethereum', 'polygon', 'binance-smart-chain'],
        //     isSellAvailable: false,
        //     isBuyAvailable: true,
        //     onClick: () => openKriptomat()
        // },
        // DISABLED: The Moonpay ready to use, but at this moment we will not release it.
        // {
        //     logo: MOONPAY_LOGO,
        //     name: 'MoonPay',
        //     type: 'Credit / Debit card',
        //     fees: 'from 1%',
        //     limits: 'up to 5000 EUR/day',
        //     currencies: 'EUR, USD, GBP and many more',
        //     networks: ['ethereum', 'polygon', 'avalanche', 'binance-smart-chain'],
        //     isSellAvailable: true,
        //     isBuyAvailable: true,
        //     onClick: () => openMoonpay(initMode, selectedAsset)
        // },
        {
            logo: RAMP_LOGO,
            name: 'Ramp',
            type: 'Bank Transfer, Credit/Debit Card, Apple Pay',
            fees: '0.49%-2.9%',
            limits: '10,000EUR/m',
            currencies: 'USD, EUR, GBP',
            networks: ['ethereum', 'polygon', 'avalanche', 'binance-smart-chain', 'gnosis'],
            isSellAvailable: false,
            isBuyAvailable: true,
            onClick: () => openRampNetwork()
        },
        {
            logo: PAYTRIE_LOGO,
            name: 'PayTrie',
            type: 'Bank Transfer',
            fees: '1% (min. $2 CAD)',
            limits: '$2,000CAD/day',
            currencies: 'CAD',
            networks: ['ethereum', 'polygon', 'binance-smart-chain'],
            isSellAvailable: false,
            isBuyAvailable: true,
            onClick: () => openPayTrie()
        },
        {
            logo: TRANSAK_LOGO,
            name: 'Transak',
            type: 'Credit/Debit card and Bank Transfer (methods availability depends on location)',
            fees: 'from 0.5%',
            limits: 'up to 15,000 EUR/day',
            currencies: 'GBP, EUR, USD and many more',
            networks: ['ethereum', 'polygon', 'avalanche', 'arbitrum', 'binance-smart-chain', 'moonriver', 'moonbeam', 'optimism'],
            isSellAvailable: false,
            onClick: () => openTransak()
        },
        {
            logo: SWAPPIN_LOGO,
            name: 'Swappin',
            type: 'Buy online gift cards, converting your crypto into real-life goods and services.',
            fees: '',
            limits: '',
            description: `Supporting more than 20.000 tokens. You can acquire digital vouchers from more than 1000 retailers worldwide, in over 40 countries.`,
            networks: ['ethereum', 'polygon', 'avalanche', 'binance-smart-chain'],
            isSellAvailable: true,
            isBuyAvailable: false,
            onClick: () => openSwappin()
        }
    ]

    const shouldBeDisabled = (networks) => {
        return networks.includes(networkDetails.id) ? null : 'disabled'
    }
    const isNoteVisible = () => providers.find(i => !i.networks.includes(networkDetails.id))
    const filteredProviders = providers.filter(p => sellMode ? p.isSellAvailable : p.isBuyAvailable)

    return (
        <div className={styles.wrapper}>
            {
                filteredProviders.map(({ logo, name, type, fees, limits, currencies, networks, description = '', onClick }) =>
                
                    <div className={`${styles.provider} ${shouldBeDisabled(networks) && styles.disabled}`} key={name} onClick={onClick}>

                        <div className={styles.logo}>
                            <img src={logo} alt={name} />
                        </div>
                        { isLoading.includes(name) ? <div> <Loading/> </div> :
                        <div className={styles.details}>
                            <div className={styles.type}>
                                { type }
                            </div>
                            {name !== 'Swappin' ? <>
                                <div className={styles.fees}>
                                    Fees: { fees }
                                </div>
                                <div className={styles.limits}>
                                    Limits: { limits }
                                </div>
                                <div className={styles.currencies}>
                                    Currencies: { currencies }
                                </div>
                            </>
                            :   <div className={styles.fees}>
                                    { description }
                                </div>
                            }
                            
                        </div>
                        }
                    </div>
                )
            }
            {
                !!isNoteVisible() && <Info className={styles.info}>
                    Some {sellMode ? 'sell' : 'deposit'} methods are unavailable on {networkDetails.name}. Switch to Ethereum for the widest support.
                </Info>
            }
        </div>
    )
}
