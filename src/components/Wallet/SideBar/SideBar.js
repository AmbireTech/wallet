import './SideBar.scss'

import { NavLink, useRouteMatch  } from 'react-router-dom'
import { MdDashboard, MdLock, MdCompareArrows, MdHelpCenter, MdMenu } from 'react-icons/md'
import { AiOutlineAppstoreAdd } from 'react-icons/ai'
import { GiReceiveMoney, GiGasPump } from 'react-icons/gi'
import { BsCurrencyExchange } from 'react-icons/bs'
import { BsPiggyBank } from 'react-icons/bs'
import { BiTransfer } from 'react-icons/bi'
import { CgArrowsExchangeV } from 'react-icons/cg'
import { Loading, Button } from 'components/common'
import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import GasIndicator from 'components/Wallet/GasIndicator/GasIndicator'

const helpCenterUrl = 'https://help.ambire.com/hc/en-us/categories/4404980091538-Ambire-Wallet'

const SideBar = ({ match, portfolio, hidePrivateValue, relayerURL, selectedNetwork, dappsCatalog }) => {
  const sidebarRef = useRef()
  const [balanceFontSize, setBalanceFontSize] = useState(0)
  const { isDappMode, sideBarOpen, toggleSideBarOpen } = dappsCatalog
  const routeMatch = useRouteMatch('/wallet/dapps')

  const dapModeSidebar = useMemo(() => isDappMode && routeMatch, [isDappMode, routeMatch])

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

  return (
    <div id="sidebar" className={(dapModeSidebar ? 'dapp-mode' : '') + (sideBarOpen ? ' open' : '') } ref={sidebarRef}>
      {dapModeSidebar &&
      <div className='ambire-logo'>
        <div className="logo" />
        <div className="icon" />
        <Button  clear icon={<MdMenu />} mini primary
          onClick={() => toggleSideBarOpen()}
        ></Button>
      </div>
      }     
      <div className="balance">
        <label>Balance</label>
        {portfolio.isCurrNetworkBalanceLoading ? (
          <div className={'loaderContainer'}>
            <Loading />
          </div>
        ) : (
          <div
            className="balanceDollarAmount"
            style={{ fontSize: balanceFontSize }}
          >
            <span className="dollarSign highlight">$</span>
            {hidePrivateValue(portfolio.balance.total.truncated)}
            <span className="highlight">
              .{hidePrivateValue(portfolio.balance.total.decimals)}
            </span>
          </div>
        )}
        <div>
          <GasIndicator 
            relayerURL={relayerURL} selectedNetwork={selectedNetwork} match={match}/>
        </div>
      </div>
      <nav>
        <NavLink to={match.url + "/dashboard"} activeClassName="selected">
          <div className="item">
              <MdDashboard/>Dashboard
          </div>
        </NavLink>
        <NavLink to={match.url + "/deposit"} activeClassName="selected">
          <div className="item">
              <GiReceiveMoney/>Deposit
          </div>
        </NavLink>
        <NavLink to={match.url + "/transfer"} activeClassName="selected">
          <div className="item">
              <BiTransfer/>Transfer
          </div>
        </NavLink>
        <NavLink to={match.url + "/swap"} activeClassName="selected">
          <div className="item">
              <BsCurrencyExchange/>Swap
          </div>
        </NavLink>
        <NavLink to={match.url + "/gas-tank"} activeClassName="selected">
          <div className="item">
              <GiGasPump/>Gas Tank
          </div>
        </NavLink>
        <NavLink to={match.url + "/cross-chain"} activeClassName="selected">
          <div className="item">
              <CgArrowsExchangeV/>Cross-Chain
          </div>
        </NavLink>
        <NavLink to={match.url + "/earn"} activeClassName="selected">
          <div className="item">
              <BsPiggyBank/>Earn
          </div>
        </NavLink>
        <NavLink to={match.url + "/transactions"} activeClassName="selected">
          <div className="item">
                <MdCompareArrows/>Transactions
          </div>
        </NavLink>
        {/* Temporarily commented OpenSea tab. */}
        {/* <NavLink to={match.url + "/opensea"} activeClassName="selected">
          <div className="item">
            <div className='opensea-icon'/>OpenSea
          </div>
        </NavLink> */}
        <NavLink to={match.url + "/security"} activeClassName="selected">
          <div className="item">
            <MdLock/>Security
          </div>
        </NavLink>
        <NavLink to={match.url + "/dapps"} activeClassName="selected">
          <div className="item">
            <AiOutlineAppstoreAdd />Dapps
          </div>
        </NavLink>
        <div className="separator"></div>
        <a href={helpCenterUrl} target="_blank" rel="noreferrer">
          <div className="item" id="help-center">
            <MdHelpCenter/>Help Center
          </div>
        </a>
      </nav>
    </div>
  )
}

export default SideBar
