import './Providers.scss'

import RAMP_LOGO from '../../../../resources/ramp.svg';
import PAYTRIE_LOGO from '../../../../resources/paytrie.svg';
import TRANSAK_LOGO from '../../../../resources/transak.svg';

import { openRampNetwork, openPayTrie, openTransak } from '../../../../services/providers'

export default function Providers({ walletAddress, networkDetails }) {
    const providers = [
        {
            logo: RAMP_LOGO,
            name: 'Ramp',
            type: 'Bank Transfer, Credit/Debit Card, Apple Pay',
            fees: '0.49%-2.9%',
            limits: '10,000EUR/m',
            currencies: 'USD, EUR, GBP',
            networks: ['ethereum', 'polygon', 'avalanche', 'binance-smart-chain'],
            onClick: () => openRampNetwork({walletAddress, selectedNetwork: networkDetails.id})
        },
        {
            logo: PAYTRIE_LOGO,
            name: 'PayTrie',
            type: 'Bank Transfer',
            fees: '1% (min. $2 CAD)',
            limits: '$2,000CAD/day',
            currencies: 'CAD',
            networks: ['ethereum', 'polygon', 'binance-smart-chain'],
            onClick: () => openPayTrie({walletAddress, selectedNetwork: networkDetails.id})
        },
        {
            logo: TRANSAK_LOGO,
            name: 'Transak',
            type: 'Credit/Debit card and Bank Transfer (methods availability depends on location)',
            fees: 'from 0.5%',
            limits: 'up to 15,000 EUR/day',
            currencies: 'GBP, EUR, USD and many more',
            networks: ['ethereum', 'polygon', 'avalanche', 'arbitrum', 'binance-smart-chain'],
            onClick: () => openTransak({walletAddress, selectedNetwork: networkDetails.id})
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
