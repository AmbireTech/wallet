import './Dashboard.css'

import { MdDashboard, MdLock, MdCompareArrows } from 'react-icons/md'
import { BsPiggyBank } from 'react-icons/bs'
import Deposit from './Deposit/Deposit'

export default function Dashboard({ accounts, onAddAccount }) {
    return (
        <section id="dashboard">
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

            <div>
              {/* TODO more elegant way to manage selected? */}
              <select id="accountSelector" onChange={onAddAccount} defaultValue={(accounts.find(x => x.selected) || {})._id}>
                {accounts.map(acc => (<option key={acc._id}>{acc._id}</option>))}
              </select>
            </div>

            <div id="topbar">

            </div>

            <div id="content">
                <Deposit address="0x7bf26452A91857Fb1334414D8F0Ea1F900Cf44dd"></Deposit>
            </div>
        </section>
    )
}