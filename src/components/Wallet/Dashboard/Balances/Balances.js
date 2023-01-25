import styles from './Balances.module.scss'

import { Icon, Loading } from 'components/common'
import { useRelayerData } from 'hooks'
import { ReactComponent as GasTankIcon } from 'resources/icons/gas-tank.svg'
import { useHistory } from 'react-router-dom'

import networks from 'consts/networks'
import BalanceItem from './BalanceItem/BalanceItem'
import { useCallback, useEffect, useRef } from 'react'

import { ReactComponent as AlertCircle } from 'resources/icons/alert-circle.svg'

const Balances = ({ portfolio, selectedNetwork, setNetwork, hidePrivateValue, relayerURL, selectedAccount, match }) => {
    const otherBalancesRef = useRef()
    const history = useHistory()
    const networkDetails = (network) => networks.find(({ id }) => id === network)
    const otherBalances = portfolio.otherBalances.filter(({ network, total }) => network !== selectedNetwork.id && total.full > 0)
    const otherBalancesLoading = portfolio.balancesByNetworksLoading
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

    // Used to add blur at the bottom of balances when scrollbar is visible
    const handleSetBlur = useCallback(() => {
        if(otherBalances || !otherBalancesLoading) {
            const el = otherBalancesRef.current
            if (!el) return

            const maxScroll = el.scrollHeight - el.clientHeight
            const isScrollable = el.scrollHeight > el.clientHeight;
            
            // GUARD: If element is not scrollable, remove all classes
            if (!isScrollable || (maxScroll <= el.scrollTop)) {
                el.classList.remove(styles.bottomOverflow);
                return;
            }
            
            el.classList.toggle(styles.bottomOverflow, true);
        } else {
        }
    }, [otherBalances, otherBalancesLoading])

    useEffect(() => {
        handleSetBlur()    
    }, [otherBalancesLoading, otherBalances, handleSetBlur])
    
    return (
        <div className={styles.wrapper}>
            { portfolio.isCurrNetworkBalanceLoading ? <Loading /> : (
                <div className={styles.otherBalances} ref={otherBalancesRef} onScroll={handleSetBlur}>
                    { !otherBalances.length && otherBalancesLoading ? <div className={styles.loadingOtherBalancesWrapper}><Loading /></div> : otherBalances.length > 0 ? (
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
                                            <Icon size="sm" className={styles.icon} noBackground>
                                                <img src={networkDetails(network).icon} alt="" />
                                            </Icon>
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
                                        <Icon size="sm" className={styles.icon} noBackground>
                                            <GasTankIcon />
                                        </Icon>
                                    }
                                />
                            }
                        </>) : <div className={styles.noOtherBalancesWrapper}>
                            <div className={styles.noOtherBalances}>
                                <AlertCircle />
                                <label>You don't have any tokens on the other networks.</label>
                            </div>
                        </div>
                    }
                </div>
            )}
        </div>
    )
}

export default Balances
