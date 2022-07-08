import './GasTank.scss'
import { Toggle } from 'components/common'
import { useState, useEffect } from 'react'
import { GiToken, GiGasPump } from 'react-icons/gi'
import { NavLink } from 'react-router-dom'
import { Button, Loading } from 'components/common'
import { MdDragIndicator, MdOutlineSort } from 'react-icons/md'
import { useDragAndDrop, useCheckMobileScreen } from 'hooks'
import { getTokenIcon } from 'lib/icons'
import { formatFloatTokenAmount } from 'lib/formatters'
import { ToolTip } from 'components/common'
import { useRelayerData } from 'hooks'
import { useModals } from 'hooks'
import { GasTankBalanceByTokensModal } from 'components/Modals'
import { HiOutlineExternalLink } from 'react-icons/hi'
import { formatUnits } from 'ethers/lib/utils'
import { getGasTankFilledTxns } from 'lib/isFeeCollectorTxn'
// eslint-disable-next-line import/no-relative-parent-imports
import { useToasts } from '../../../../hooks/toasts'

const GasTank = ({ network, 
    relayerURL, 
    portfolio, 
    account, 
    userSorting, 
    setUserSorting,
    gasTankState, 
    setGasTankState 
}) => {
    const [cacheBreak, setCacheBreak] = useState(() => Date.now())
    const { showModal } = useModals()
    const { addToast } = useToasts()

    useEffect(() => {
        if (Date.now() - cacheBreak > 5 * 1000) setCacheBreak(Date.now())
        const intvl = setTimeout(() => setCacheBreak(Date.now()), 60 * 1000)
        return () => clearTimeout(intvl)
    }, [cacheBreak])

    const urlGetBalance = relayerURL ? `${relayerURL}/gas-tank/${account}/getBalance?cacheBreak=${cacheBreak}` : null
    const urlGetFeeAssets = relayerURL ? `${relayerURL}/gas-tank/assets?cacheBreak=${cacheBreak}` : null
    const urlGetTransactions = relayerURL ? `${relayerURL}/identity/${account}/${network.id}/transactions` : null

    const { data: balancesRes, isLoading } = useRelayerData(urlGetBalance)
    const { data: feeAssetsRes} = useRelayerData(urlGetFeeAssets)
    const { data: executedTxnsRes } = useRelayerData(urlGetTransactions)
    
    const gasTankBalances = balancesRes && balancesRes.length && balancesRes.map(({balanceInUSD}) => balanceInUSD).reduce((a, b) => a + b, 0)
    const gasTankTxns = executedTxnsRes && executedTxnsRes.txns.length && executedTxnsRes.txns.filter(item => !!item.gasTankFee)
    const totalSavedResult = gasTankTxns && gasTankTxns.length && gasTankTxns.map(item => item.feeInUSDPerGas * item.gasLimit).reduce((a, b) => a + b)
    const totalSaved = formatFloatTokenAmount(totalSavedResult, true, 2)
    const feeAssetsPerNetwork = feeAssetsRes && feeAssetsRes.length && feeAssetsRes.filter(item => item.network === network.id)
    const executedTxns = executedTxnsRes && executedTxnsRes.txns.length && executedTxnsRes.txns
    const gasTankFilledTxns = executedTxns && executedTxns.length && getGasTankFilledTxns(executedTxns)
    
    const { isBalanceLoading, tokens } = portfolio
    const sortType = userSorting.tokens?.sortType || 'decreasing'
    const isMobileScreen = useCheckMobileScreen()
    const availableFeeAssets = feeAssetsPerNetwork?.map(item => {
        const isFound = tokens?.find(x => x.address.toLowerCase() === item.address.toLowerCase()) 
        if (isFound) return isFound
        return { ...item, balance: 0, balanceUSD: 0, decimals: 0 }
    })
    const [failedImg, setFailedImg] = useState([])
    const toLocaleDateTime = date => `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
    const sortedTokens = availableFeeAssets?.sort((a, b) => {
        if (sortType === 'custom' && userSorting.tokens?.items?.[`${account}-${network.chainId}`]?.length) {
            const sorted = userSorting.tokens.items[`${account}-${network.chainId}`].indexOf(a.address) - userSorting.tokens.items[`${account}-${network.chainId}`].indexOf(b.address)
            return sorted
        } else {
            const decreasing = b.balanceUSD - a.balanceUSD
            if (decreasing === 0) return a.symbol.localeCompare(b.symbol)
            return decreasing
        }
    })

    const onDropEnd = (list) => {        
        setUserSorting(
            prev => ({
                ...prev,
                tokens: {
                    sortType: 'custom',
                    items: {
                        ...prev.tokens?.items,
                        [`${account}-${network.chainId}`]: list
                    }
                }
            })
        )
    }

    const { dragStart, dragEnter, target, handle, dragTarget,drop } = useDragAndDrop('address', onDropEnd)
    const currentAccGasTankState = gasTankState.length ? 
    gasTankState.find(i => i.account === account) :
        setGasTankState([
            ...gasTankState,
            { account: account, isEnabled: false }
        ])
    const toggleGasTank = () => {
        if (!gasTankBalances && !gasTankBalances.length) {
            addToast('You should add assets in Gas Tank to be able to enable it!', { error: true })
            return 
        }

        const updatedGasTankDetails = 
            gasTankState.map(item => (item.account === account) ? 
            { ...item, isEnabled: !item.isEnabled } : item)
        setGasTankState(updatedGasTankDetails)
    }

    const openGasTankBalanceByTokensModal = () => {
        showModal(<GasTankBalanceByTokensModal data={ (balancesRes && balancesRes.length) ? balancesRes : [] }/>)
    }

    const tokenItem = (index, img, symbol, balance, balanceUSD, address, send = false, network, decimals, category, sortedTokensLength) => 
        {
            const logo = failedImg.includes(img) ? getTokenIcon(network, address) : img
                
            return (<div className="token" key={`token-${address}-${index}`}
                disabled={balanceUSD === 0}
                draggable={category === 'tokens' && sortedTokensLength > 1 && sortType === 'custom' && !isMobileScreen}
                onDragStart={(e) => {
                    if (handle.current === target.current || handle.current.contains(target.current)) dragStart(e, index)
                    else e.preventDefault();
                }}
                onMouseDown={(e) => dragTarget(e, index)}
                onDragEnter={(e) => dragEnter(e, index)}
                onDragEnd={() => drop(sortedTokens)}
                onDragOver={(e) => e.preventDefault()}
                >
                {sortedTokensLength > 1 && sortType === 'custom' && !isMobileScreen && <MdDragIndicator size={20} className='drag-handle' onClick={(e) => dragStart(e, index)} id={`${index}-handle`} />}
                <div className="icon">
                    { 
                        failedImg.includes(logo) ?
                            <GiToken size={20}/>
                            :
                            <img src={logo} draggable="false" alt="Token Icon" onError={() => setFailedImg(failed => [...failed, logo])}/>
                    }
                </div>
                <div className="name">
                    { symbol.toUpperCase() }
                </div>
                <div className="separator"></div>
                <div className="balance">
                    <div className="currency">
                        <span className="value">{ formatFloatTokenAmount(balance, true, decimals) }</span>
                        <span className="symbol">{ symbol.toUpperCase() }</span>
                    </div>
                    <div className="dollar">
                        <span className="symbol">$</span> { balanceUSD.toFixed(2) }
                    </div>
                </div>
                {
                    send ? 
                        <div className="actions">
                            <NavLink to={{
                                pathname: `/wallet/transfer/${address}`,
                                state: {
                                    gasTankMsg: 'Warning: You are about to fill up your Gas Tank. Fillings to the Gas Tank are non-refundable.',
                                    feeAssetsPerNetwork
                                }
                            }}>
                                <Button small>Fill up</Button>
                            </NavLink>
                        </div>
                        :
                        null
                }
            </div>)
        }

    return (
        <div id="gas-tank">
            <div className='heading-wrapper'>
                <div className="balance-wrapper" style={{ cursor: 'pointer' }} onClick={openGasTankBalanceByTokensModal}>
                    <span><GiGasPump/> Gas Tank Balance</span>
                    { !isLoading ?
                        (<div>
                            <span>$ </span>{ gasTankBalances ? formatFloatTokenAmount(gasTankBalances, true, 2) : '0.00' }
                        </div>) : 
                        <Loading /> }
                    {/* TODO: Add functionality for drag and drop */}
                    {/* <span>Drag and drop tokens here</span> */}
                </div>
                <div className='switch-wrapper'>
                    <Toggle checked={currentAccGasTankState.isEnabled} onChange={() => toggleGasTank()}/>
                    {currentAccGasTankState.isEnabled ? <span>Enabled</span> : <span>Disabled</span>}
                </div>

                <div className="balance-wrapper total-save">
                    <span>Total Save</span>
                    <div>
                        <span>$ </span>{totalSaved ? totalSaved : '0.00'}
                    </div>
                </div>
            </div>
            <div>
                <p>The Ambire Gas Tank is your special account for paying gas and saving on gas fees. By filling up your Gas Tank, you are setting aside, or prepaying for network fees. You can add more tokens to your Gas Tank at any time.</p>
                <p>Please note that only the tokens listed below are eligible for filling up your gas tank.</p>
            </div>
            <div className="sort-holder">
                <span className='title'>Available fee tokens</span>
                {sortedTokens && !isMobileScreen &&  (
                    <div className="sort-buttons">
                        <ToolTip label='Sorted tokens by drag and drop'>
                            <MdDragIndicator color={sortType === "custom" ? "#80ffdb" : ""} cursor="pointer" onClick={() => setUserSorting(prev => ({
                                ...prev,
                                tokens: {
                                    ...prev.tokens,
                                    sortType: 'custom'
                                }
                            }))} />
                        </ToolTip>
                        <ToolTip label='Sorted tokens by DESC balance'>
                            <MdOutlineSort color={sortType === "decreasing" ? "#80ffdb" : ""} cursor="pointer" onClick={() => setUserSorting(prev => ({
                                ...prev,
                                tokens: {
                                    ...prev.tokens,
                                    sortType: 'decreasing'
                                }
                            }))} />
                        </ToolTip>
                    </div>
                )}
            </div>
            <div className="list">
                { !isBalanceLoading ?
                        sortedTokens && sortedTokens?.map(({ address, symbol, tokenImageUrl, balance, balanceUSD, network, decimals, icon }, i) =>
                            tokenItem(
                                i, 
                                tokenImageUrl = tokenImageUrl || icon, 
                                symbol, 
                                balance, 
                                balanceUSD, 
                                address, 
                                true, 
                                network, 
                                decimals, 
                                'tokens', 
                                sortedTokens.length
                            ))
                        : <Loading />  }
            </div>
            <span className='title'>Gas Tank fillings history</span>
            <p className='warning-msg'>Warning: It will take some time to fill up the Gas Tank after the filling up transaction is made.</p>
            <div className="txns-wrapper">
                {
                    gasTankFilledTxns && gasTankFilledTxns.length ? gasTankFilledTxns.map((item, key) => {
                        const tokenDetails = feeAssetsRes && feeAssetsRes.length ? 
                            feeAssetsRes.find(({address, network}) => address.toLowerCase() === item.address.toLowerCase() && network === item.network) : null
                    
                        return (
                            <div key={key} className="txns-item-wrapper">
                                <div className='logo'><GiGasPump size={20} /></div>
                                <div className='date'>{ item.submittedAt && toLocaleDateTime(new Date(item.submittedAt)).toString() }</div>
                                <div className='balance'>
                                    { tokenDetails && 
                                        (<>
                                            <img width="25px" height='25px' alt='logo' src={tokenDetails.icon || getTokenIcon(item.network, item.address)} /> 
                                            <div>{ tokenDetails.symbol.toUpperCase() }</div>
                                            { tokenDetails && formatUnits(item.value.toString(), tokenDetails.decimals).toString() }
                                        </>)
                                    }
                                </div>
                                <div className='logo'>
                                    <a
                                        href={network.explorerUrl + '/tx/'+ item.txId}
                                        target='_blank'
                                        rel='noreferrer'
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <HiOutlineExternalLink size={20} />
                                    </a>
                                </div>
                            </div>)
                    }) : <p>No fillings are made to Gas Tank on {network.id.toUpperCase()}</p>
                }
            </div>
            <div>
                <NavLink to={{
                    pathname: `/wallet/transfer/`,
                    state: {
                        gasTankMsg: 'Warning: You are about to fill up your Gas Tank. Fillings to the Gas Tank are non-refundable.',
                        feeAssetsPerNetwork
                    }
                }}>
                    <Button className='deposit-button' small>fill up gas tank</Button>
                </NavLink>
            </div>
        </div>
    )
}

export default GasTank
