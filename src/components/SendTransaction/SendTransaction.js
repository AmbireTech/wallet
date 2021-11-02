//import { GrInspect } from 'react-icons/gr'
import { GiTakeMyMoney, GiMagnifyingGlass } from 'react-icons/gi'
import './SendTransaction.css'

export default function SendTransaction ({ userAction }) {
    console.log(userAction)
    const actionable = userAction 
        ? (<>
                <div>{userAction.bundle.txns[0][0]}</div>
                <button onClick={userAction.fn}>Send txn</button>
            </>)
        : (<></>)
    return (<div id="sendTransaction">
        <div className="panel">
            <div className="heading">
                    <div className="title">
                        <GiMagnifyingGlass size={35}/>
                        Transaction summary
                    </div>
            </div>
        </div>
        <div className="panel">
            <div className="heading">
                    <div className="title">
                        <GiTakeMyMoney size={35}/>
                        Fee
                    </div>
                    {actionable}
            </div>
        </div>
    </div>)
}