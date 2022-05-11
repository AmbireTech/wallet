import './Providers.scss'

import RAMP_LOGO from 'resources/ramp.svg';
import PAYTRIE_LOGO from 'resources/paytrie.svg';
import TRANSAK_LOGO from 'resources/transak.svg';
import KRIPTOMAT_LOGO from 'resources/kriptomat.svg';

import { Loading } from 'components/common'
import useProviders from './useProviders'

export default function Providers({ walletAddress, networkDetails, relayerURL }) {
    const { openRampNetwork, openPayTrie, openTransak, openKriptomat, isLoading } = useProviders({ walletAddress, selectedNetwork: networkDetails.id, relayerURL })
    
    const providers = [
        {
            logo: KRIPTOMAT_LOGO,
            name: 'Kriptomat',
            type: 'Credit Card',
            fees: '2.45%',
            limits: 'up to 450 EUR/day',
            currencies: 'EUR',
            networks: ['ethereum', 'binance-smart-chain'],
            onClick: () => openKriptomat()
        },
        {
            logo: RAMP_LOGO,
            name: 'Ramp',
            type: 'Bank Transfer, Credit/Debit Card, Apple Pay',
            fees: '0.49%-2.9%',
            limits: '10,000EUR/m',
            currencies: 'USD, EUR, GBP',
            networks: ['ethereum', 'polygon', 'avalanche', 'binance-smart-chain'],
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
            networks: ['ethereum', 'polygon', 'avalanche', 'arbitrum', 'binance-smart-chain'],
            onClick: () => openTransak()
        }
    ];

    const shouldBeDisabled = (networks) => {
        return networks.includes(networkDetails.id) ? null : 'disabled'; 
    };

    return (
        <div id="providers">
            {
                providers.map(({ logo, name, type, fees, limits, currencies, networks, onClick }) =>
                
                    <div className={`provider ${shouldBeDisabled(networks)}`} key={name} onClick={onClick}>
                        <div className="logo">
                            <img src={logo} alt={name}></img>
                        </div>
                        { isLoading.includes(name) ? <div> <Loading/> </div> :
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
                        }
                    </div>
                )
            }
            {
                networkDetails.id !== 'ethereum' ? 
                    <div id="network-warning">
                        <b>NOTE:</b> Some deposit methods are unavailable on <b>{networkDetails.name}</b>. Switch to Ethereum for the widest support.
                    </div>
                    :
                    null
            }
        </div>
    )
}
