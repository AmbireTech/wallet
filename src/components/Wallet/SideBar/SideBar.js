import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { NavLink, useRouteMatch  } from 'react-router-dom'
import cn from 'classnames'

import { Loading, Button } from 'components/common'
import GasIndicator from 'components/Wallet/SideBar/GasIndicator/GasIndicator'

import { MdClose } from 'react-icons/md'
import { ReactComponent as DashboardIcon } from './images/dashboard.svg'
import { ReactComponent as DepositIcon } from './images/deposit.svg'
import { ReactComponent as TransferIcon } from './images/transfer.svg'
import { ReactComponent as SwapIcon } from './images/swap.svg'
import { ReactComponent as GasTankIcon } from './images/gas-tank.svg'
import { ReactComponent as CrossChainIcon } from './images/cross-chain.svg'
import { ReactComponent as EarnIcon } from './images/earn.svg'
import { ReactComponent as TransactionsIcon } from './images/transactions.svg'
import { ReactComponent as SecurityIcon } from './images/security.svg'
import { ReactComponent as DappsIcon } from './images/dapps.svg'
import { ReactComponent as HelpIcon } from './images/help.svg'

import styles from './SideBar.module.scss'

const helpCenterUrl = 'https://help.ambire.com/hc/en-us/categories/4404980091538-Ambire-Wallet'

const round = num => Math.round((num + Number.EPSILON) * 100) / 100

const SideBar = ({ match, portfolio, hidePrivateValue, relayerURL, selectedNetwork, dappsCatalog }) => {
  const networkBalance = portfolio.balance.total.full
  const allTokensWithoutPrice = portfolio?.tokens.length && portfolio?.tokens.every(t => !t.price)
  const shortBalance = networkBalance >= 10000 ? `${String(round(networkBalance/1000)).split('.').join(',')}K` : (allTokensWithoutPrice && !networkBalance ? ' -' : networkBalance.toFixed(2))
  const sidebarRef = useRef()
  const [balanceFontSize, setBalanceFontSize] = useState(0)
  const { isDappMode, sideBarOpen, toggleSideBarOpen, toggleDappMode } = dappsCatalog
  const routeMatch = useRouteMatch('/wallet/dapps')

  const dappModeSidebar = useMemo(() => isDappMode && routeMatch, [isDappMode, routeMatch])

    const resizeBalance = useCallback(() => {
        const balanceFontSizes = {
            3: '2em',
            5: '1.5em',
            7: '1.3em',
            9: '1.2em',
            11: '1em',
        }

        const charLength = portfolio.balance.total.truncated.length
        const closest = Object.keys(balanceFontSizes).reduce((prev, current) => Math.abs(current - charLength) < Math.abs(prev - charLength) ? current : prev)
        setBalanceFontSize(balanceFontSizes[closest])
    }, [portfolio.balance.total])

    useEffect(() => resizeBalance(), [resizeBalance])

  const onDappsClick = useCallback(() => {
    if(dappModeSidebar) {
      toggleDappMode()
    }
  }, [dappModeSidebar, toggleDappMode])

  return (
    <div className={cn(styles.wrapper, {
        [styles.dappMode]: dappModeSidebar,
        [styles.open]: sideBarOpen
    })} ref={sidebarRef}>
      {/* NOTE: click outside not working because of the iframe - ths is simpler than adding event listeners to the dapps ifeame  */}
      {dappModeSidebar && sideBarOpen && <div className={styles.outsideHandler} onClick={() => toggleSideBarOpen()}></div> }
      {dappModeSidebar &&
      <div className={styles.ambireLogo}>
        <div className={styles.logo} />
        <div className={styles.icon} />
        <Button variant="secondary" size="xsm" startIcon={<MdClose size={23} />}
          onClick={toggleSideBarOpen}
        ></Button>
      </div>
      }

      { !dappModeSidebar && <NavLink to={'/wallet/dashboard'} className={styles.sidebarLogo}>
        <img src='/resources/logo.svg' alt='ambire-logo' />
      </NavLink>
      }
      <div className={styles.balance}>
        <label>Balance</label>
        {portfolio.isCurrNetworkBalanceLoading ? (
          <div className={'loaderContainer'}>
            <Loading />
          </div>
        ) : (
          <div
            className={styles.balanceDollarAmount}
            style={{ fontSize: balanceFontSize }}
          >
            <span className={cn(styles.dollarSign, styles.highlight)}>$</span>
            {hidePrivateValue(shortBalance)}
          </div>
        )}
        <div>
          <GasIndicator 
            relayerURL={relayerURL} selectedNetwork={selectedNetwork} match={match}/>
        </div>
      </div>
      <nav>
        <NavLink to={match.url + "/dashboard"} activeClassName={styles.selected}>
          <div className={styles.item}>
              <DashboardIcon />Dashboard
          </div>
        </NavLink>
        <NavLink to={match.url + "/deposit"} activeClassName={styles.selected}>
          <div className={styles.item}>
              <DepositIcon />Deposit
          </div>
        </NavLink>
        <NavLink to={match.url + "/transfer"} activeClassName={styles.selected}>
          <div className={styles.item}>
              <TransferIcon />Transfer
          </div>
        </NavLink>
        <NavLink to={match.url + "/swap"} activeClassName={styles.selected}>
          <div className={styles.item}>
              <SwapIcon />Swap
          </div>
        </NavLink>
        <NavLink to={match.url + "/gas-tank"} activeClassName={styles.selected}>
          <div className={styles.item}>
              <GasTankIcon/>Gas Tank
          </div>
        </NavLink>
        <NavLink to={match.url + "/cross-chain"} activeClassName={styles.selected}>
          <div className={styles.item}>
              <CrossChainIcon />Cross-Chain
          </div>
        </NavLink>
        <NavLink to={match.url + "/earn"} activeClassName={styles.selected}>
          <div className={styles.item}>
              <EarnIcon />Earn
          </div>
        </NavLink>
        <NavLink to={match.url + "/transactions"} activeClassName={styles.selected}>
          <div className={styles.item}>
                <TransactionsIcon />Transactions
          </div>
        </NavLink>
        {/* Temporarily commented OpenSea tab. */}
        {/* <NavLink to={match.url + "/opensea"} activeClassName={styles.selected}>
          <div className={styles.item}>
            <div className='opensea-icon'/>OpenSea
          </div>
        </NavLink> */}
        <NavLink to={match.url + "/dapps"} activeClassName={styles.selected}>
          <div className={styles.item} onClick={onDappsClick}>
              <DappsIcon />dApps
          </div>
        </NavLink>
        <NavLink to={match.url + "/security"} activeClassName={styles.selected}>
          <div className={styles.item}>
            <SecurityIcon />Security
          </div>
        </NavLink>
        <a href={helpCenterUrl} target="_blank" rel="noreferrer">
          <div className={cn(styles.item, styles.helpLink)}>
            <HelpIcon />Help Center
          </div>
        </a>
      </nav>
    </div>
  )
}

export default SideBar
