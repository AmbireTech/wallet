//import { GrInspect } from 'react-icons/gr'
// GiObservatory is also interesting
import { Interface } from 'ethers/lib/utils'
import { GiTakeMyMoney, GiSpectacles } from 'react-icons/gi'
import verifiedContracts from '../../consts/verifiedContracts'
import networks from '../../consts/networks'
import './SendTransaction.css'

export default function SendTransaction ({ userAction }) {
    console.log(userAction)
    const actionable = userAction 
        ? (<>
                <button onClick={userAction.fn}>Send txn</button>
            </>)
        : (<></>)
    const getSummary = txn => {
        if (!userAction) return 'internal err: no user action'

        const [to, value, data] = txn
        let callSummary, sendSummary
        // @TODO proper asset symbol
        const network = networks.find(x => x.id === userAction.bundle.network)

        const contractKey = userAction.bundle.network + ':' + to
        const contractInfo = verifiedContracts[contractKey]

        if (parseInt(value) > 0) sendSummary = `send ${(parseInt(value)/1e18).toFixed(4)} ${network.nativeAssetSymbol} to ${contractInfo ? contractInfo.name : to}`
        if (data !== '0x') {
            if (contractInfo) {
                const iface = new Interface(contractInfo.abi)
                const parsed = iface.parseTransaction({ data, value })
                callSummary = `Interaction with ${contractInfo.name}: ${parsed.name}`
            } else callSummary = `unknown call to ${to}`
        }
        return [callSummary, sendSummary].filter(x => x).join(', ')
    }
    return (<div id="sendTransaction">
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
                                {getSummary(txn)}
                            </li>
                        )) : (<></>)}
                    </ul>
            </div>
        </div>
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
                    {actionable}
            </div>
        </div>
    </div>)
}