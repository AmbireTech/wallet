import './Platform.css'

import { Switch, Route, Redirect } from 'react-router-dom'
import { MdDashboard, MdLock, MdCompareArrows } from 'react-icons/md'
import { BsPiggyBank } from 'react-icons/bs'
import Dashboard from './Dashboard/Dashboard'

export default function Platform({ match, allNetworks, accounts, selectedAcc, onSelectAcc, network, setNetwork }) {
    return (
        <div id="platform">
            <div id="sidebar">
                <div className="logo"/>

                <div className="balance">
                    <label>Balance</label>
                    <div className="balanceDollarAmount"><span className="dollarSign highlight">$</span>999<span className="highlight">.00</span></div>
                </div>

                {/* TODO proper navi, programmatic selected class */}
                <div className="item selected"><MdDashboard size={30}/>Dashboard</div>
                <div className="item"><MdLock size={30}/>Security</div>
                <div className="item"><MdCompareArrows size={30}/>Transactions</div>
                <div className="item"><BsPiggyBank size={30}/>Earn</div>

            </div>

            {/* Top-right dropdowns */}
            <div>
                <select id="accountSelector" onChange={ ev => onSelectAcc(ev.target.value) } defaultValue={selectedAcc}>
                    {accounts.map(acc => (<option key={acc.id}>{acc.id}</option>))}
                </select>

                <select id="networkSelector" onChange = { ev => setNetwork(ev.target.value) } defaultValue={network.name}>
                    {allNetworks.map(network => (<option key={network.id}>{network.name}</option>))}
                </select>
            </div>

            <Switch>
                <Route path={match.url + "/dashboard"}>
                    <Dashboard selectedAcc={selectedAcc}/>
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