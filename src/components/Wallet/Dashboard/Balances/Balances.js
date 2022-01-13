import './Balances.scss'

import networks from 'consts/networks'

const Balances = ({ portfolio, selectedNetwork, setNetwork }) => {
    const networkDetails = (network) => networks.find(({ id }) => id === network)
    const otherBalances = portfolio.otherBalances.filter(({ network, total }) => network !== selectedNetwork.id && total.full > 0)

    return (
        <div id="balances">
            <span className="green-highlight">$</span> { portfolio.balance.total.truncated }
            <span className="green-highlight">.{ portfolio.balance.total.decimals }</span>
            <div id="other-balances">
                { otherBalances.length ? <label>You also have</label> : null }
                {
                    otherBalances.map(({ network, total }, i) => (
                        <div className="balance-container" key={network}>
                            <div className="other-balance" onClick={() => setNetwork(network)}>
                                <label>
                                    <span className="purple-highlight">$</span> { total.truncated }
                                    <span className="purple-highlight">.{total.decimals}</span>
                                </label>
                                on
                                <div className="network">
                                    <div className="icon" style={{backgroundImage: `url(${networkDetails(network).icon})`}}></div>
                                    <div className="name">
                                        { networkDetails(network).name }
                                    </div>
                                </div>
                            </div>
                            { otherBalances.length - 1 !== i ? <label>and</label> : null }
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default Balances