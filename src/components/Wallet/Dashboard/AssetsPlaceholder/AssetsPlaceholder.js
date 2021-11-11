import './AssetsPlaceholder.scss'

import { NavLink } from 'react-router-dom'
import { GiReceiveMoney } from 'react-icons/gi'
import { Button } from '../../../common'

const AssetsPlaceholder = () => {
    const tokens = [
        {
            icon: 'https://storage.googleapis.com/zapper-fi-assets/tokens/ethereum/0xade00c28244d5ce17d72e40330b1c318cd12b7c3.png',
            symbol: 'ADX',
            balance: 170027.26,
            balanceUSD: 138880.64
        },
        {
            icon: 'https://storage.googleapis.com/zapper-fi-assets/tokens/ethereum/0x0000000000000000000000000000000000000000.png',
            symbol: 'ETH',
            balance: 61.77,
            balanceUSD: 283170.08
        },
        {
            icon: 'https://storage.googleapis.com/zapper-fi-assets/tokens/ethereum/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png',
            symbol: 'WBTC',
            balance: 0.03,
            balanceUSD: 2227.24
        },
    ]

    return (
        <div id="assets-placeholder" >
            <div className="placeholder-overlay">
                <label>
                    Welcome! You don't have any funds on this account.
                </label>
                <NavLink to="/wallet/deposit">
                    <Button small icon={<GiReceiveMoney/>}>Deposit</Button>
                </NavLink>
            </div>
            <div className="category">
                <div className="title">Tokens</div>
                <div className="list">
                    {
                        tokens.map(({ icon, symbol, balance, balanceUSD }) => (
                            <div className="token" key={symbol}>
                                <div className="icon">
                                    <img src={icon} alt="Token Icon"/>
                                </div>
                                <div className="name">
                                    { symbol }
                                </div>
                                <div className="separator"></div>
                                <div className="balance">
                                    <div className="currency">
                                        { balance } <span className="symbol">{ symbol }</span>
                                    </div>
                                    <div className="dollar">
                                        <span className="symbol">$</span> { balanceUSD }
                                    </div>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    )
}

export default AssetsPlaceholder