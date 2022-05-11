import './GasTank.scss'
import { FaGasPump } from 'react-icons/fa'
import { Toggle } from 'components/common'
import { useState, useEffect } from 'react'
import { BiTransferAlt } from 'react-icons/bi'
import { GiToken } from 'react-icons/gi'
import { NavLink } from 'react-router-dom'
import { Button, Loading } from 'components/common'
import { MdDragIndicator, MdOutlineSort } from 'react-icons/md'
import { useDragAndDrop, useCheckMobileScreen } from 'hooks'
import { getTokenIcon } from 'lib/icons'
import { formatFloatTokenAmount } from 'lib/formatters'
import { ToolTip } from 'components/common'
import { useRelayerData, useLocalStorage } from 'hooks'
import { useModals } from 'hooks'
import { GasTankBalanceByTokensModal } from 'components/Modals'
import { HiOutlineExternalLink } from 'react-icons/hi'

const GasTank = ({ network, relayerURL, portfolio, account, userSorting, setUserSorting }) => {
    const [cacheBreak, setCacheBreak] = useState(() => Date.now())
    const { showModal } = useModals()

    useEffect(() => {
        if (Date.now() - cacheBreak > 5 * 1000) setCacheBreak(Date.now())
        const intvl = setTimeout(() => setCacheBreak(Date.now()), 60 * 1000)
        return () => clearTimeout(intvl)
    }, [cacheBreak])

    const urlGetBalance = relayerURL ? `${relayerURL}/gas-tank/${account}/getBalance` : null
    const urlGetFeeAssets = relayerURL ? `${relayerURL}/gas-tank/assets` : null
    const { data, errMsg, isLoading } = useRelayerData(urlGetBalance)
    const gasTankBalance = data?.map(({balanceInUSD}) => balanceInUSD).reduce((a, b) => a + b, 0).toFixed(2)
    const feeAssetsRes = useRelayerData(urlGetFeeAssets)
    const feeAssetsPerNetwork = feeAssetsRes.data?.filter(item => item.network === network.id)
    const { isBalanceLoading, tokens } = portfolio
    const sortType = userSorting.tokens?.sortType || 'decreasing'
    const isMobileScreen = useCheckMobileScreen()
    const availableFeeAssets = feeAssetsPerNetwork?.map(item => {
        const isFound = tokens?.find(x => x.address.toLowerCase() === item.address.toLowerCase()) 
        if (isFound) return isFound
        return { ...item, balance: 0, balanceUSD: 0, decimals: 0 }
    })
    const [failedImg, setFailedImg] = useState([])
    
    // ================= TO REMOVE =================
    const mockedTxns = [
        {
            dateTime: '2022-03-01 12:32',
            gasPayed: '11.32',
            saved: '1.23',
            chargeBack: '0.23',
            address: '0x9394584921923894912394e'
        },
        {
            dateTime: '2022-02-21 10:11',
            gasPayed: '10.00',
            saved: '0.91',
            chargeBack: '0.13',
            address: '0x9394584921923894912394e'
        },
        {
            dateTime: '2022-01-01 02:32',
            gasPayed: '15.32',
            saved: '2.23',
            chargeBack: '0.66',
            address: '0x9394584921923894912394e'
        }
    ]
    // =============================================
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

    const {
        dragStart,
        dragEnter,
        target,
        handle,
        dragTarget,
        drop
    } = useDragAndDrop(
        'address',
        onDropEnd)

    const [isGasTankEnabled, setIsGasTankEnabled] = useLocalStorage({ key: 'isGasTankEnabled', defaultValue: false })
    const toggleGasTank = () => {
        setIsGasTankEnabled(!isGasTankEnabled)
    }

    const openGasTankBalanceByTokensModal = () => {
        showModal(<GasTankBalanceByTokensModal data={ data && data }/>)
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
                                    gasTankMsg: "Warning: Deposits to the Gas Tank",
                                    feeAssetsPerNetwork
                                }
                            }}>
                                <Button small>Deposit</Button>
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
                    <span><FaGasPump/> Gas Tank Balance</span>
                    <div><span>$</span>{gasTankBalance}</div>
                    <span>Drag and drop tokens here</span>
                </div>
                <div className='switch-wrapper'>
                    <Toggle checked={isGasTankEnabled} onChange={() => toggleGasTank()}/>
                    {isGasTankEnabled ? <span>Enabled</span> : <span>Disabled</span>}
                </div>

                <div className="balance-wrapper total-save">
                    <span>TOTAL SAVE</span>
                    <div><span>$</span>43.23</div>
                </div>
            </div>
            <div>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p> 
            </div>
            <div className="sort-holder">
                Available fee tokens
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
                { 
                   sortedTokens && sortedTokens?.map(({ address, symbol, tokenImageUrl, balance, balanceUSD, network, decimals }, i) =>
                        tokenItem(i, tokenImageUrl, symbol, balance, balanceUSD, address, true, network, decimals, 'tokens', sortedTokens.length))
                }
            </div>
            <div className="txns-wapper">
                {
                    mockedTxns && mockedTxns.map((item, key) => {
                        // TODO: Fix the styles
                        return (<div key={key} className="txns-item-wapper">
                            <BiTransferAlt />
                            <span>{item.dateTime}</span>
                            <span>Gas payed: {item.gasPayed}</span>
                            <span>Saved: {item.saved}</span>
                            <span>Chargeback: {item.chargeBack}</span>
                                <a
                                    href={network.explorerUrl + '/address/' + item.address}
                                    target='_blank'
                                    rel='noreferrer'
                                    onClick={e => e.stopPropagation()}
                                >
                                    <HiOutlineExternalLink size={25} />
                                </a>
                            
                        </div>)
                    })
                }
            </div>
            <div>
                <NavLink to={{
                    pathname: `/wallet/transfer/`,
                    state: {
                        gasTankMsg: "Warning: Deposits to the Gas Tank",
                        feeAssetsPerNetwork
                    }
                }}>
                    <Button className='deposit-button' small>Deposit to gas tank</Button>
                </NavLink>
            </div>
        </div>
    )
}

export default GasTank
