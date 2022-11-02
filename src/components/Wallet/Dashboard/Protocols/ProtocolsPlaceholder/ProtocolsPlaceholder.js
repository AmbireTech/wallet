import { NavLink } from 'react-router-dom'
import { Button } from 'components/common'
import { MdOutlineAdd } from 'react-icons/md'
import { useLocalStorage } from 'hooks'

import { ReactComponent as DepositIcon } from 'components/Wallet/SideBar/images/deposit.svg'

import styles from './ProtocolsPlaceholder.module.scss'

const ProtocolsPlaceholder = ({ onClickAddToken, onClickShowToken }) => {
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

    const listHiddenTokens = useLocalStorage({ key: 'hiddenTokens'})
    let hiddenTokensCount = 0
    
    if (listHiddenTokens && listHiddenTokens[0] !== null) {
        hiddenTokensCount = listHiddenTokens[0].length
    }
    
    return (
        <div className={styles.wrapper}>
            <div className={styles.placeholderOverlay}>
                <label>
                    Welcome! You don't have any funds on this account.
                </label>
                <NavLink to="/wallet/deposit">
                    <Button small icon={<DepositIcon />}>Deposit</Button>
                </NavLink>
                <div className={styles.addToken}>
                    <label>You have a token that's not displayed?</label>
                    <Button mini clear icon={<MdOutlineAdd/>} onClick={onClickAddToken}>Click here to add it</Button>
                    {hiddenTokensCount > 0 && (<label style={{ cursor: 'pointer'}} onClick={onClickShowToken}>There are also {hiddenTokensCount} hidden tokens. Click to configure</label>)}
                </div>
            </div>
            <div className={styles.category}>
                <div className={styles.title}>Tokens</div>
                <div className={styles.list}>
                    {
                        tokens.map(({ icon, symbol, balance, balanceUSD }) => (
                            <div className={styles.token} key={symbol}>
                                <div className={styles.icon}>
                                    <img src={icon} alt="Token Icon"/>
                                </div>
                                <div className={styles.name}>
                                    { symbol }
                                </div>
                                <div className={styles.separator}></div>
                                <div className={styles.balance}>
                                    <div className={styles.currency}>
                                        { balance } <span className={styles.symbol}>{ symbol }</span>
                                    </div>
                                    <div className={styles.dollar}>
                                        <span className={styles.symbol}>$</span> { balanceUSD }
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

export default ProtocolsPlaceholder