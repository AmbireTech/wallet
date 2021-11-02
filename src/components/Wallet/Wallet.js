import './Wallet.css'

import { Switch, Route, Redirect, NavLink } from 'react-router-dom'
import { MdDashboard, MdLock, MdCompareArrows, } from 'react-icons/md'
import { GiReceiveMoney } from 'react-icons/gi'
import { BsPiggyBank } from 'react-icons/bs'
import { BiTransfer } from 'react-icons/bi'
import Dashboard from './Dashboard/Dashboard'
import DropDown from '../common/DropDown/DropDown'

export default function Wallet({ match, allNetworks, accounts, selectedAcc, onSelectAcc, network, setNetwork, connections, disconnect }) {    
    return (
        <div id="wallet">
            <div id="sidebar">
                <div className="logo"/>

                <div className="balance">
                    <label>Balance</label>
                    <div className="balanceDollarAmount"><span className="dollarSign highlight">$</span>999<span className="highlight">.00</span></div>
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
                <NavLink to={match.url + "/tansfer"} activeClassName="selected">
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

            {/* Top-right dropdowns */}
            <div id="topbar">
                <select id="accountSelector" onChange={ ev => onSelectAcc(ev.target.value) } defaultValue={selectedAcc}>
                    {accounts.map(acc => (<option key={acc.id}>{acc.id}</option>))}
                </select>

                <DropDown title="dApps" badge={connections.length}>
                    {connections.map(({ session, uri }) => (
                        <div className="item dapps-item" key={session.peerId}>
                            <div className="icon">
                                <img src={session.peerMeta.icons[0]} alt={session.peerMeta.name}></img>
                            </div>
                            <div className="name">
                                { session.peerMeta.name }
                            </div>
                            <div className="separator"></div>
                            <button onClick={() => disconnect(uri)}>Disconnect</button>
                        </div>)
                    )}
                </DropDown>

                <select id="networkSelector" onChange = { ev => setNetwork(ev.target.value) } defaultValue={network.name}>
                    {allNetworks.map(network => (<option key={network.id}>{network.name}</option>))}
                </select>
            </div>

            <Switch>
                <Route path={match.url + "/dashboard"}>
                    <Dashboard selectedAcc={selectedAcc} selectedNetwork={network.name}/>
                </Route>
                <Route path={match.url + "/security"}></Route>
                <Route path={match.url + "/transactions"}></Route>
                <Route path={match.url + "/swap"}></Route>
                <Route path={match.url + "/earn"}></Route>

                <Route path={match.url + "/"}>
                    <Redirect to={match.url + "/dashboard"}/>
                </Route>
            </Switch>
        </div>
    )
}