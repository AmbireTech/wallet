import './Deposit.css'

import { MdWarning, MdAccountBalance, MdAccountBalanceWallet } from 'react-icons/md'
import TextInput from '../../common/TextInput/TextInput'
import Providers from './Providers/Providers'

export default function Deposit({ address }) {
    return (
        <section id="deposit">
            <div className="panel">
                <div className="heading">
                     <div className="title">
                        <MdAccountBalanceWallet size={40}/>
                        Deposit Tokens
                    </div>
                    <div className="subtitle">
                        Direct Deposit
                    </div>
                </div>
                <div className="description">
                    Send tokens or collectables to this address:
                    <TextInput value={address} copy/>
                </div>
                <div id="address-warning">
                    <span className="warning"><MdWarning size={17}/></span> Please make sure to <b>select Ethereum as transfer network</b> if sending tokens from Binance.
                    <span className="danger"> Otherwise the funds will not be credited to your account.</span>
                </div>
            </div>
            <div className="panel">
                <div className="heading">
                    <div className="title">
                        <MdAccountBalance size={40}/>
                        Fiat Currency
                    </div>
                    <div className="subtitle">
                        Credit Card & Bank Transfer
                    </div>
                </div>
                <div className="description">
                    Deposit with credit card to your account directly using one of our partners
                </div>
                <Providers/>
            </div>
        </section>
    )
}