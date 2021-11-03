//import { GrInspect } from 'react-icons/gr'
// GiObservatory is also interesting
import { Interface } from 'ethers/lib/utils'
import { GiTakeMyMoney, GiSpectacles } from 'react-icons/gi'
import { FaSignature } from 'react-icons/fa'
import verifiedContracts from '../../consts/verifiedContracts'
import networks from '../../consts/networks'
import ERC20ABI from 'adex-protocol-eth/abi/ERC20'
import './SendTransaction.css'

const ERC20 = new Interface(ERC20ABI)
const TRANSFER_SIGHASH = ERC20.getSighash(ERC20.getFunction('transfer').format())

export default function SendTransaction ({ userAction }) {
    const actionable = userAction 
        ? (<>
                <button onClick={userAction.fn}>Send txn</button>
            </>)
        : (<></>)

    // @TODO custom parsing for univ2 contracts, exact output, etc.
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
            if (data.startsWith(TRANSFER_SIGHASH)) {
                const [to, amount] = ERC20.decodeFunctionData('transfer', data)
                // @TODO decimals
                callSummary `send ${(amount/1e18).toFixed(4)} to ${to}`
            } else if (contractInfo) {
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
    </div>)
}