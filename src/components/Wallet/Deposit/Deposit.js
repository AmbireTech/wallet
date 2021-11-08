import './Deposit.scss'

import { MdAccountBalance, MdAccountBalanceWallet } from 'react-icons/md'
import TextInput from '../../common/TextInput/TextInput'
import Providers from './Providers/Providers'

import ETHEREUM_LOGO from '../../../resources/ethereum-logo.png'
import POLYGON_LOGO from '../../../resources/polygon-logo.svg'

export default function Deposit({ selectedAcc, selectedNetwork }) {
    return (
        <section id="deposit">
            <div className="panel">
                <div className="heading">
                     <div className="title">
                        <MdAccountBalanceWallet size={35}/>
                        Deposit Tokens
                    </div>
                    <div className="subtitle">
                        Direct Deposit
                    </div>
                </div>
                <div className="description">
                    <TextInput className="depositAddress" label="Send tokens or collectables (NFTs) to this address:" value={selectedAcc} copy/>
                </div>
                <div id="networks">
                    Following networks supported:
                    <div className="logos">
                        <img src={ETHEREUM_LOGO} alt="Ethereum"/>
                        <img src={POLYGON_LOGO} alt="Polygon"/>
                    </div>
                </div>
            </div>
            <div className="panel">
                <div className="heading">
                    <div className="title">
                        <MdAccountBalance size={35}/>
                        Fiat Currency
                    </div>
                    <div className="subtitle">
                        Credit Card & Bank Transfer
                    </div>
                </div>
                <div className="description">
                    Deposit with credit card to your account directly using one of our partners
                </div>
                <Providers walletAddress={selectedAcc} selectedNetwork={selectedNetwork}/>
            </div>
        </section>
    )
}