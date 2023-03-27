import { NavLink } from 'react-router-dom'
import { Button } from 'components/common'
import { useLocalStorage } from 'hooks'

import Token from 'components/Wallet/Dashboard/Tokens/Token/Token'
import TokensWrapper from 'components/Wallet/Dashboard/Tokens/TokensWrapper/TokensWrapper'

import { ReactComponent as DepositIcon } from 'components/Wallet/SideBar/images/deposit.svg'
import { ReactComponent as AddIcon } from 'resources/icons/add.svg'
import tokens from './tokens'

import styles from './TokensPlaceholder.module.scss'

const TokensPlaceholder = ({ onClickAddToken, onClickShowToken, footer }) => {
  const listHiddenTokens = useLocalStorage({ key: 'hiddenTokens' })
  let hiddenTokensCount = 0

  if (listHiddenTokens && listHiddenTokens[0] !== null) {
    hiddenTokensCount = listHiddenTokens[0].length
  }

  return (
    <TokensWrapper
      className={styles.blur}
      wrapperChildren={
        <div className={styles.placeholderOverlay}>
          <h2>Welcome! You don't have any funds on this account.</h2>
          <NavLink to="/wallet/deposit">
            <Button small icon={<DepositIcon />}>
              Deposit
            </Button>
          </NavLink>
          <div className={styles.addToken}>
            <p>You have a token that's not displayed?</p>
            <Button
              mini
              clear
              icon={<AddIcon />}
              onClick={onClickAddToken}
              className={styles.addTokenButton}
            >
              Click here to add it
            </Button>
            {hiddenTokensCount > 0 && (
              <p onClick={onClickShowToken} className={styles.clickable}>
                There are also {hiddenTokensCount} hidden tokens. Click to configure
              </p>
            )}
          </div>
        </div>
      }
      wrapperEndChildren={footer}
    >
      {tokens.map(({ icon, symbol, balance, balanceUSD, address, network }) => (
        <Token
          key={address || symbol}
          address={address}
          network={network}
          // Token data
          img={icon}
          symbol={symbol}
          balance={balance}
          value={balanceUSD}
          price="0.94"
        />
      ))}
    </TokensWrapper>
  )
}

export default TokensPlaceholder
