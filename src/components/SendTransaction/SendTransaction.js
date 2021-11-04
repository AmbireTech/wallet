//import { GrInspect } from 'react-icons/gr'
// GiObservatory is also interesting
import { GiTakeMyMoney, GiSpectacles } from 'react-icons/gi'
import { FaSignature } from 'react-icons/fa'
import { getTransactionSummary } from '../../lib/humanReadableTransactions'
import './SendTransaction.css'

export default function SendTransaction ({ userAction }) {
    const actionable = userAction 
        ? (<>
                <button className='rejectTxn'>Reject</button>
                <button onClick={userAction.fn}>Sign and send</button>
            </>)
        : (<></>)

    return (<div id="sendTransaction">
        <h2>Pending transaction</h2>
        <div className="panelHolder">
            <div className="panel">
                <div className="heading">
                        <div className="title">
                            <GiSpectacles size={35}/>
                            Transaction summary
                        </div>
                        <ul>
                            {userAction ? userAction.bundle.txns.map((txn, i) => (
                                <li key={txn}>
                                    {i === userAction.bundle.txns.length - 1 ? 'Fee: ' : ''}
                                    {getTransactionSummary(txn, userAction.bundle)}
                                </li>
                            )) : (<></>)}
                        </ul>
                </div>
            </div>
            <div className="secondaryPanel">
                <div className="panel">
                    <div className="heading">
                            <div className="title">
                                <GiTakeMyMoney size={35}/>
                                Fee
                            </div>
                            {
                                userAction ? (
                                    <div className="fees">
                                        <div className="feeSquare"><div className="speed">Slow</div>${userAction.estimation.feeInUSD.slow}</div>
                                        <div className="feeSquare"><div className="speed">Medium</div>${userAction.estimation.feeInUSD.medium}</div>
                                        <div className="feeSquare selected"><div className="speed">Fast</div>${userAction.estimation.feeInUSD.fast}</div>
                                        <div className="feeSquare"><div className="speed">Ape</div>${userAction.estimation.feeInUSD.ape}</div>

                                    </div>
                                )
                                : (<></>)
                            }
                            <span style={{ marginTop: '1em' }}>Fee currency</span>
                            <select defaultValue="USDT">
                                <option>USDT</option>
                                <option>USDC</option>
                            </select>
                    </div>
                </div>
                <div className="panel">
                    <div className="heading">
                        <div className="title">
                            <FaSignature size={35}/>
                            Sign
                        </div>
                    </div>
                    {actionable}
                </div>
            </div>
        </div>
    </div>)
}