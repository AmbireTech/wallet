import "./SideBar.scss"

import { NavLink } from 'react-router-dom'
import { MdDashboard, MdLock, MdCompareArrows, } from 'react-icons/md'
import { GiReceiveMoney } from 'react-icons/gi'
import { BsPiggyBank } from 'react-icons/bs'
import { BiTransfer } from 'react-icons/bi'
import { Loading } from "../common"

const SideBar = ({match, portfolio}) => {
    return (
        <div id="sidebar">
                <NavLink to={match.url + "/dashboard"}>
                    <div className="logo" />
                </NavLink>

                <div className="balance">
                    <label>Balance</label>
                    {
                        portfolio.isLoading ?
                            <Loading/>
                            :
                            <div className="balanceDollarAmount">
                                <span className="dollarSign highlight">$</span>{ portfolio.totalUSD.formated }<span className="highlight">.{ portfolio.totalUSD.decimals }</span>
                            </div>
                    }
                </div>

                {/* TODO proper navi, programmatic selected class */}
                <NavLink to={match.url + "/dashboard"} activeClassName="selected">
                    <div className="item">
                        <MdDashboard size={30}/>Dashboard
                    </div>
                </NavLink>
                <NavLink to={match.url + "/deposit"} activeClassName="selected">
                    <div className="item">
                        <GiReceiveMoney size={30}/>Deposit
                    </div>
                </NavLink>
                <NavLink to={match.url + "/transfer"} activeClassName="selected">
                    <div className="item">
                        <BiTransfer size={30}/>Transfer
                    </div>
                </NavLink>
                <NavLink to={match.url + "/security"} activeClassName="selected">
                    <div className="item">
                        <MdLock size={30}/>Security
                    </div>
                </NavLink>
                <NavLink to={match.url + "/swap"} activeClassName="selected">
                    <div className="item">
                        <MdCompareArrows size={30}/>Transactions
                    </div>
                </NavLink>
                <NavLink to={match.url + "/earn"} activeClassName="selected">
                    <div className="item">
                        <BsPiggyBank size={30}/>Earn
                    </div>
                </NavLink>
            </div>
    )
}

export default SideBar