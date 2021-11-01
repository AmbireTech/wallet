import './Dashboard.css'

import { MdDashboard, MdLock, MdCompareArrows } from 'react-icons/md'
import { BsPiggyBank } from 'react-icons/bs'
import Deposit from './Deposit/Deposit'
import useAccounts from '../../hooks/accounts'
import useWalletConnect from '../../hooks/walletconnect'

export default function Dashboard() {
  const { accounts, selectedAcc, onSelectAcc } = useAccounts()
  const { connections, disconnect, userAction } = useWalletConnect({ selectedAcc, chainId: 137 })

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

            {/* Top-right dropdowns */}
            <div>
              <select id="accountSelector" onChange={ ev => onSelectAcc(ev.target.value) } defaultValue={selectedAcc}>
                {accounts.map(acc => (<option key={acc._id}>{acc._id}</option>))}
              </select>

              <select id="networkSelector" defaultValue="Ethereum">
                <option>Ethereum</option>
                <option>Polygon</option>
              </select>
            </div>

            <div id="dashboardArea">
              {connections.map(({ session, uri }) =>
                (<div key={session.peerId} style={{ marginBottom: 20 }}>
                  <button onClick={() => disconnect(uri)}>Disconnect {session.peerMeta.name}</button>
                </div>)
              )}
              {userAction ? (<><div>{userAction.bundle.txns[0][0]}</div><button onClick={userAction.fn}>Send txn</button></>) : (<></>)}

              <Deposit address="0x7bf26452A91857Fb1334414D8F0Ea1F900Cf44dd"></Deposit>
            </div>
        </section>
    )
}