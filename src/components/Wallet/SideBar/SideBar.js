import './SideBar.scss'

import { NavLink } from 'react-router-dom'
import { MdDashboard, MdLock, MdCompareArrows } from 'react-icons/md'
import { GiReceiveMoney } from 'react-icons/gi'
import { BsPiggyBank } from 'react-icons/bs'
import { BiTransfer } from 'react-icons/bi'
import { Loading } from '../../common'
import { useCallback, useEffect, useRef, useState } from 'react'

const SideBar = ({ match, portfolio, eligibleReqLength }) => {
  const sidebarRef = useRef()
  const [balanceFontSize, setBalanceFontSize] = useState(0)
  const pendingTransactions = eligibleReqLength > 0
  const pendingTxnCount = (eligibleReqLength > 9) ? '9+' : eligibleReqLength.toString()

    const resizeBalance = useCallback(() => {
        const balanceFontSizes = {
            3: '2em',
            5: '1.5em',
            7: '1.3em',
            9: '1.2em',
            11: '1em',
        }

        if (portfolio.balance.total.truncated) {
            const charLength = portfolio.balance.total.truncated.length
            const closest = Object.keys(balanceFontSizes).reduce((prev, current) => Math.abs(current - charLength) < Math.abs(prev - charLength) ? current : prev)
            setBalanceFontSize(balanceFontSizes[closest])
        }
    }, [portfolio.balance.total])

    useEffect(() => resizeBalance(), [resizeBalance])

  return (
    <div id="sidebar" ref={sidebarRef}>
      <NavLink to={match.url + '/dashboard'}>
        <div id="logo" />
        <div id="icon" />
      </NavLink>

      <div className="balance">
        <label>Balance</label>
        {portfolio.isBalanceLoading ? (
          <Loading />
        ) : (
          <div
            className="balanceDollarAmount"
            style={{ fontSize: balanceFontSize }}
          >
            <span className="dollarSign highlight">$</span>
            {portfolio.balance.total.truncated}
            <span className="highlight">
              .{portfolio.balance.total.decimals}
            </span>
          </div>
        )}
      </div>

      {/* TODO proper navi, programmatic selected class */}
      <NavLink to={match.url + '/dashboard'} activeClassName="selected">
        <div className="item">
          <MdDashboard size={30} />
          Dashboard
        </div>
      </NavLink>
      <NavLink to={match.url + '/deposit'} activeClassName="selected">
        <div className="item">
          <GiReceiveMoney size={30} />
          Deposit
        </div>
      </NavLink>
      <NavLink to={match.url + '/transfer'} activeClassName="selected">
        <div className="item">
          <BiTransfer size={30} />
          Transfer
        </div>
      </NavLink>
      <NavLink to={match.url + '/earn'} activeClassName="selected">
        <div className="item">
          <BsPiggyBank size={30} />
          Earn
        </div>
      </NavLink>
      <NavLink to={match.url + '/transactions'} activeClassName="selected">
        <div className="item">
          {pendingTransactions ? (
            <>
              <span className="badge-wrapper ">{pendingTxnCount}</span>
              <span>Transactions</span>
            </>
          ) : (
            <>
              <MdCompareArrows size={30} />
              Transactions
            </>
          )}
        </div>
      </NavLink>
      <NavLink to={match.url + '/security'} activeClassName="selected">
        <div className="item">
          <MdLock size={30} />
          Security
        </div>
      </NavLink>
    </div>
  )
}

export default SideBar
