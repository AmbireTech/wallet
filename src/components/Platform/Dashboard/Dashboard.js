import './Dashboard.css'

import Deposit from './Deposit/Deposit'
import useAccounts from '../../../hooks/accounts'
import useWalletConnect from '../../../hooks/walletconnect'

export default function Dashboard() {
  const { selectedAcc } = useAccounts()
  const { connections, disconnect, userAction } = useWalletConnect({ selectedAcc, chainId: 137 })

    return (
        <section id="dashboard">
            <div id="dashboardArea">
              {connections.map(({ session, uri }) =>
                (<div key={session.peerId} style={{ marginBottom: 20 }}>
                  <button onClick={() => disconnect(uri)}>Disconnect {session.peerMeta.name}</button>
                </div>)
              )}
              {userAction ? (<><div>{userAction.bundle.txns[0][0]}</div><button onClick={userAction.fn}>Send txn</button></>) : (<></>)}

              <Deposit depositAddress={selectedAcc}></Deposit>
            </div>
        </section>
    )
}