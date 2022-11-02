import { NavLink } from 'react-router-dom'
import { Button } from 'components/common'
import { useLocalStorage } from 'hooks'

import TokensWrapper from 'components/Wallet/Dashboard/Tokens/TokensWrapper/TokensWrapper'

import { ReactComponent as DepositIcon } from 'components/Wallet/SideBar/images/deposit.svg'
import { ReactComponent as SendIcon } from 'resources/icons/send.svg'
import { ReactComponent as EarnIcon } from 'resources/icons/earn.svg'
import { ReactComponent as SwapIcon } from 'resources/icons/swap-2.svg'
import { ReactComponent as AddIcon } from 'resources/icons/add.svg'

import tokenStyles from 'components/Wallet/Dashboard/Tokens/Token/Token.module.scss'
import styles from './TokensPlaceholder.module.scss'

const TokensPlaceholder = ({ onClickAddToken, onClickShowToken, footer }) => {
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
        <TokensWrapper 
            className={styles.blur}
            wrapperChildren={
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
            }
            wrapperEndChildren={footer}
        >
            {tokens.map(({ icon, symbol, balance, balanceUSD }) => (
                <div className={tokenStyles.wrapper}>
                    <div className={tokenStyles.body}>
                        <h3 className={tokenStyles.baseInfo}>
                            <div className={tokenStyles.iconWrapper}>
                                <img 
                                    src={icon} 
                                    draggable="false" 
                                    alt="Token Icon" 
                                    className={tokenStyles.icon}
                                />
                            </div>
                            <div className={tokenStyles.balanceAndSymbol}>
                                <h3 className={tokenStyles.symbol}>{ symbol }</h3>
                                <p className={tokenStyles.balance}>
                                    { balance }
                                </p>
                            </div>
                        </h3>
                        <div className={tokenStyles.priceAndValue}>
                            <h3 className={tokenStyles.price}>
                                $0.94
                            </h3>
                            <h3 className={tokenStyles.value}>
                                <span className={tokenStyles.symbol}>$</span> { balanceUSD }
                            </h3>
                        </div>
                    </div>
                    <div className={tokenStyles.actions}>
                        <div className={tokenStyles.action}>
                            <SendIcon />
                        </div>
                        <div className={tokenStyles.action}>
                            <EarnIcon />
                        </div>
                        <div className={tokenStyles.action}>
                            <SwapIcon />
                        </div>
                    </div>
                </div>
            ))}
        </TokensWrapper>
    )
}

export default TokensPlaceholder