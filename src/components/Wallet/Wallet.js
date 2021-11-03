import './Wallet.css'

import { Switch, Route, Redirect, NavLink } from 'react-router-dom'
import { MdDashboard, MdLock, MdCompareArrows, } from 'react-icons/md'
import { FiHelpCircle } from 'react-icons/fi'
import { GiReceiveMoney } from 'react-icons/gi'
import { BsPiggyBank } from 'react-icons/bs'
import { BiTransfer } from 'react-icons/bi'
import Dashboard from './Dashboard/Dashboard'
import Deposit from './Deposit/Deposit'
import DropDown from '../common/DropDown/DropDown'
import { useEffect, useState } from 'react'

export default function Wallet({ match, allNetworks, accounts, selectedAcc, onSelectAcc, network, setNetwork, connections, connect, disconnect, balances }) {
    const [isClipboardGranted, setClipboardGranted] = useState(false);

    const checkPermissions = async () => {
        let status = false
        try {
            const response = await navigator.permissions.query({ name: 'clipboard-read', allowWithoutGesture: false })
            status = response.state === 'granted' || response.state === 'prompt' ? true : false
        } catch (e) {
            console.error(e)
        }
        setClipboardGranted(status)
        return status
    };

    const readClipboard = async () => {
        if (await checkPermissions()) {
            const content = await navigator.clipboard.readText()
            connect({ uri: content })
        } else {
            const uri = prompt('Enter WalletConnect URI')
            connect({ uri })
        }
    };

    useEffect(() => checkPermissions(), []);

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
                <DropDown title="dApps" badge={connections.length}>
                    <div id="connect-dapp">
                        <div className="heading">
                            <button disabled={isClipboardGranted} onClick={readClipboard}>Connect dApp</button>
                            <FiHelpCircle size={30}/>
                        </div>
                        {
                            isClipboardGranted ?
                                <label>Automatic connection enabled, just copy a WalletConnect URL and come back to this tab.</label>
                                :
                                null
                        }
                    </div>
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

                <select id="accountSelector" onChange={ ev => onSelectAcc(ev.target.value) } defaultValue={selectedAcc}>
                    {accounts.map(acc => (<option key={acc.id}>{acc.id}</option>))}
                </select>

                <select id="networkSelector" onChange = { ev => setNetwork(ev.target.value) } defaultValue={network.name}>
                    {allNetworks.map(network => (<option key={network.id}>{network.name}</option>))}
                </select>
            </div>

            <div id="wallet-container">
                <Switch>
                    <Route path={match.url + "/dashboard"}>
                        <Dashboard balances={balances}/>
                    </Route>
                    <Route path={match.url + "/deposit"}>
                        <Deposit selectedAcc={selectedAcc} selectedNetwork={network.id}/>
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
        </div>
    )
}
