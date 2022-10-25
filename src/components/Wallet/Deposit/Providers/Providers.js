
import RAMP_LOGO from 'resources/payment-providers/ramp.svg';
import PAYTRIE_LOGO from 'resources/payment-providers/paytrie.svg';
import TRANSAK_LOGO from 'resources/payment-providers/transak.svg';
import KRIPTOMAT_LOGO from 'resources/payment-providers/kriptomat.svg';
import GUARDARIAN_LOGO from 'resources/payment-providers/guardarian.svg'

import { Loading } from 'components/common'
import useProviders from './useProviders'

import styles from './Providers.module.scss'

import { ReactComponent as InfoIcon } from 'resources/icons/information.svg' 

export default function Providers({ walletAddress, networkDetails, relayerURL, portfolio }) {
    const { openRampNetwork, openPayTrie, openTransak, openKriptomat, openGuardarian, isLoading } = useProviders({ walletAddress, selectedNetwork: networkDetails.id, relayerURL, portfolio })
    
    const providers = [
        {
            logo: GUARDARIAN_LOGO,
            name: 'Guardarian',
            type: 'Buy with Bank Transfer, Credit/Debit Card, Sell Crypto',
            fees: 'from 2%',
            limits: 'up to 15k EUR/monthly on and off ramp',
            currencies: 'GBP, EUR, USD and many more',
            networks: ['ethereum', 'polygon', 'binance-smart-chain', 'fantom'],
            onClick: () => openGuardarian()
        },
        {
            logo: KRIPTOMAT_LOGO,
            name: 'Kriptomat',
            type: 'Credit Card',
            fees: '2.45%',
            limits: 'up to 5000 EUR/day',
            currencies: 'USD, EUR, GBP',
            networks: ['ethereum', 'polygon', 'avalanche', 'binance-smart-chain'],
            onClick: () => openKriptomat()
        },
        {
            logo: RAMP_LOGO,
            name: 'Ramp',
            type: 'Bank Transfer, Credit/Debit Card, Apple Pay',
            fees: '0.49%-2.9%',
            limits: '10,000EUR/m',
            currencies: 'USD, EUR, GBP',
            networks: ['ethereum', 'polygon', 'avalanche', 'binance-smart-chain', 'gnosis'],
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
            onClick: () => openTransak()
        }
    ];

    const shouldBeDisabled = (networks) => {
        return networks.includes(networkDetails.id) ? null : 'disabled'; 
    };

    return (
        <div className={styles.wrapper}>
            {
                providers.map(({ logo, name, type, fees, limits, currencies, networks, onClick }) =>
                
                    <div className={`${styles.provider} ${shouldBeDisabled(networks) || ''}`} key={name} onClick={onClick}>
                        <div className={styles.logo}>
                            <img src={logo} alt={name}></img>
                        </div>
                        { isLoading.includes(name) ? <div> <Loading/> </div> :
                        <div className={styles.details}>
                            <div className={styles.type}>
                                { type }
                            </div>
                            <div className={styles.fees}>
                                Fees: { fees }
                            </div>
                            <div className={styles.limits}>
                                Limits: { limits }
                            </div>
                            <div className={styles.currencies}>
                                Currencies: { currencies }
                            </div>
                        </div>
                        }
                    </div>
                )
            }
            {
                networkDetails.id !== 'ethereum' ? 
                    <label className={styles.networkWarning}>
                        <InfoIcon />
                        <label>
                            Some deposit methods are unavailable on {networkDetails.name}. Switch to Ethereum for the widest support.
                        </label>
                    </label>
                    :
                    null
            }
        </div>
    )
}
