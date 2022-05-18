import './Balances.scss'

import { Loading } from 'components/common'

import networks from 'consts/networks'

const Balances = ({ portfolio, selectedNetwork, setNetwork, hidePrivateValue }) => {
    const networkDetails = (network) => networks.find(({ id }) => id === network)
    const otherBalances = portfolio.otherBalances.filter(({ network, total }) => network !== selectedNetwork.id && total.full > 0)
    const otherBalancesLoading = Object.entries(portfolio.balancesByNetworksLoading).find(ntw => ntw[0] !== selectedNetwork.id && ntw[1])

    return (
        <div id="balances">
            { portfolio.isCurrNetworkBalanceLoading && otherBalancesLoading ? <Loading /> : (
                <>
                { portfolio.isCurrNetworkBalanceLoading ? <Loading /> : (
                    <div>
                        <span className="green-highlight">$</span> { hidePrivateValue(portfolio.balance.total.truncated) }
                        <span className="green-highlight">.{ hidePrivateValue(portfolio.balance.total.decimals) }</span>
                    </div>
                )}
            
                <div id="other-balances">
                    { otherBalancesLoading ? <Loading /> : (
                        <>
                            { otherBalances.length ? <label>You also have</label> : null }
                            {
                                otherBalances.filter(({ network }) => networkDetails(network)).map(({ network, total }, i) => (
                                    <div className="balance-container" key={network}>
                                        <div className="other-balance" onClick={() => setNetwork(network)}>
                                            <label>
                                                <span className="purple-highlight">$</span> { hidePrivateValue(total.truncated) }
                                                <span className="purple-highlight">.{hidePrivateValue(total.decimals)}</span>
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
                        </>)
                    }
                </div>
            </>
            )}
        </div>
    )
}

export default Balances
