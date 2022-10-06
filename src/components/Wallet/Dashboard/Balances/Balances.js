import styles from './Balances.module.scss'

import { Loading } from 'components/common'
import { useRelayerData } from 'hooks'
import { ReactComponent as GasTankIcon } from 'resources/icons/gas-tank.svg'
import { useHistory } from 'react-router-dom'

import networks from 'consts/networks'
import BalanceItem from './BalanceItem/BalanceItem'

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
                <div className={styles.otherBalances}>
                    { otherBalancesLoading ? <Loading /> : (
                        <>
                            {
                                otherBalances.filter(({ network }) => networkDetails(network)).map(({ network, total }, i) => (
                                    <BalanceItem 
                                        onClick={() => setNetwork(network)}
                                        key={network}
                                        name={networkDetails(network).name}
                                        value={hidePrivateValue(total.truncated)}
                                        decimalValue={hidePrivateValue(total.decimals)}
                                        icon={
                                            <div className={styles.icon} style={{backgroundImage: `url(${networkDetails(network).icon})`}}></div>
                                        }
                                    />
                                ))
                            }
                            { gasTankDetails && (gasTankDetails.total.full > 0) && !isLoading &&
                               <BalanceItem 
                                    onClick={() => history.push('/wallet/gas-tank')}
                                    name={gasTankDetails.label}
                                    value={hidePrivateValue(gasTankDetails.total.truncated)}
                                    decimalValue={hidePrivateValue(gasTankDetails.total.decimals)}
                                    icon={
                                        <div className={styles.iconSvg}><GasTankIcon /></div>
                                    }
                                />
                            }
                        </>)
                    }
                </div>
            )}
        </div>
    )
}

export default Balances
