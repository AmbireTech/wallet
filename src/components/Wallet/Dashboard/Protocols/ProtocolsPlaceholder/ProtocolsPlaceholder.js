import { NavLink } from 'react-router-dom'
import { Button } from 'components/common'
import { useLocalStorage } from 'hooks'

import ProtocolsWrapper from 'components/Wallet/Dashboard/Protocols/ProtocolsWrapper/ProtocolsWrapper'
import protocolStyles from 'components/Wallet/Dashboard/Protocols/Protocol/Protocol.module.scss'

import { ReactComponent as DepositIcon } from 'components/Wallet/SideBar/images/deposit.svg'
import { ReactComponent as SendIcon } from 'resources/icons/send.svg'
import { ReactComponent as EarnIcon } from 'resources/icons/earn.svg'
import { ReactComponent as SwapIcon } from 'resources/icons/swap-2.svg'
import { ReactComponent as AddIcon } from 'resources/icons/add.svg'

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
                    <Button 
                        mini 
                        clear 
                        icon={<AddIcon />} 
                        onClick={onClickAddToken}
                        className={styles.addTokenButton}
                    >
                        Click here to add it
                    </Button>
                    {hiddenTokensCount > 0 && (<label onClick={onClickShowToken}>There are also {hiddenTokensCount} hidden tokens. Click to configure</label>)}
                </div>
            </div>
            <ProtocolsWrapper className={styles.blur}>
                {tokens.map(({ icon, symbol, balance, balanceUSD }) => (
                    <div className={protocolStyles.wrapper}>
                        <h3 className={protocolStyles.name}>
                            <div className={protocolStyles.iconWrapper}>
                            { 
                                <img 
                                    src={icon} 
                                    draggable="false" 
                                    alt="Token Icon" 
                                    className={protocolStyles.icon}
                                />
                            }
                            </div>
                            { symbol }
                        </h3>
                        <h3 className={protocolStyles.balance}>
                            { balance }
                        </h3>
                        <h3 className={protocolStyles.price}>
                            $0.94
                        </h3>
                        <h3 className={protocolStyles.value}>
                            <span className={protocolStyles.symbol}>$</span> { balanceUSD }
                        </h3>
                        {/* <h3 className={styles.pending}>
                            Pending
                        </h3>
                        <h3 className={styles.pending}>
                            Pending+
                        </h3> */}
                        <div className={protocolStyles.actions}>
                            <div className={protocolStyles.action}>
                                <SendIcon />
                            </div>
                            <div className={protocolStyles.action}>
                                <EarnIcon />
                            </div>
                            <div className={protocolStyles.action}>
                                <SwapIcon />
                            </div>
                        </div>
                    </div>
                ))}
            </ProtocolsWrapper>
        </div>
    )
}

export default ProtocolsPlaceholder