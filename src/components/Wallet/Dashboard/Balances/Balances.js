import styles from './Balances.module.scss'

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
        <div className={styles.wrapper}>
            { portfolio.isCurrNetworkBalanceLoading && otherBalancesLoading ? <Loading /> : (
                <>
                { portfolio.isCurrNetworkBalanceLoading ? <Loading /> : (
                    <div>
                        <span className={styles.greenHighlight}>$</span> { hidePrivateValue(portfolio.balance.total.truncated) }
                        <span className={styles.greenHighlight}>.{ hidePrivateValue(portfolio.balance.total.decimals) }</span>
                    </div>
                )}
            
                <div className={styles.otherBalances}>
                    { otherBalancesLoading ? <Loading /> : (
                        <>
                            { otherBalances.length ? <label>You also have</label> : null }
                            {
                                otherBalances.filter(({ network }) => networkDetails(network)).map(({ network, total }, i) => (
                                    <div className={styles.balanceContainer} key={network}>
                                        <div className={styles.otherBalance} onClick={() => setNetwork(network)}>
                                            <label>
                                                <span className={styles.purpleHighlight}>$</span> { hidePrivateValue(total.truncated) }
                                                <span className={styles.purpleHighlight}>.{hidePrivateValue(total.decimals)}</span>
                                            </label>
                                            on
                                            <div className={styles.network}>
                                                <div className={styles.icon} style={{backgroundImage: `url(${networkDetails(network).icon})`}}></div>
                                                <div className={styles.name}>
                                                    { networkDetails(network).name }
                                                </div>
                                            </div>
                                        </div>
                                        { otherBalances.length - (gasTankDetails.total.full > 0.00 ? 0 : 1) !== i ? <label>and</label> : null }
                                    </div>
                                ))
                            }
                            { gasTankDetails && (gasTankDetails.total.full > 0) && !isLoading &&
                                <div className={styles.balanceContainer}>
                                    <div className={styles.otherBalance} onClick={() => history.push('/wallet/gas-tank')}>
                                        <label>
                                            <span className={styles.purpleHighlight}>$</span> { hidePrivateValue(gasTankDetails.total.truncated) }
                                            <span className={styles.purpleHighlight}>.{ hidePrivateValue(gasTankDetails.total.decimals) }</span>
                                        </label>
                                        on
                                        <div className={styles.network}>
                                            <div className='icon-svg'><GiGasPump size={20}/></div>
                                            <div className={styles.name}>
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
