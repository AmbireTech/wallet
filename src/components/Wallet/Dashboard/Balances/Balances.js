import './Balances.scss'

import { Loading } from 'components/common'
import { useRelayerData } from 'hooks'
import { GiGasPump } from 'react-icons/gi'
import { useHistory } from 'react-router-dom'

import networks from 'consts/networks'

const Balances = ({ portfolio, selectedNetwork, setNetwork, hidePrivateValue, relayerURL, selectedAccount, match }) => {
    const history = useHistory()
    const networkDetails = (network) => networks.find(({ id }) => id === network)
    const otherBalances = portfolio.otherBalances.filter(({ network, total }) => network !== selectedNetwork.id && total.full > 0)
    const otherBalancesLoading = Object.entries(portfolio.balancesByNetworksLoading).find(ntw => ntw[0] !== selectedNetwork.id && ntw[1])
    const urlGetBalance = relayerURL ? `${relayerURL}/gas-tank/${selectedAccount}/getBalance` : null
    const { data: balancesRes, isLoading } = useRelayerData({ url: urlGetBalance })
    const gasTankBalances = balancesRes && balancesRes.length && balancesRes.map(({balanceInUSD}) => balanceInUSD).reduce((a, b) => a + b, 0)    
    const [truncated, decimals] = gasTankBalances ? Number(gasTankBalances.toString()).toFixed(2).split('.')  : [0, 0]
    const gasTankDetails = {
        label: 'Gas Tank',
        total: {
            full: gasTankBalances ? gasTankBalances : 0.00,
            decimals,
            truncated
        }
    }
    
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
                                        { otherBalances.length - (gasTankDetails.total.full > 0.00 ? 0 : 1) !== i ? <label>and</label> : null }
                                    </div>
                                ))
                            }
                            { gasTankDetails && (gasTankDetails.total.full > 0) && !isLoading &&
                                <div className="balance-container">
                                    <div className="other-balance" onClick={() => history.push('/wallet/gas-tank')}>
                                        <label>
                                            <span className="purple-highlight">$</span> { hidePrivateValue(gasTankDetails.total.truncated) }
                                            <span className="purple-highlight">.{ hidePrivateValue(gasTankDetails.total.decimals) }</span>
                                        </label>
                                        on
                                        <div className="network">
                                            <div className='icon-svg'><GiGasPump size={20}/></div>
                                            <div className="name">
                                                { gasTankDetails.label }
                                            </div>
                                        </div>
                                    </div>
                                </div>
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
