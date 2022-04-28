import './GasTank.scss'
import { FaGasPump } from 'react-icons/fa'
import { Toggle } from 'components/common'
import { useState } from 'react'


import { GiToken } from 'react-icons/gi'
import { NavLink } from 'react-router-dom'
import { Button, Loading } from 'components/common'
import { MdDragIndicator, MdOutlineSort } from 'react-icons/md'
import { useDragAndDrop, useCheckMobileScreen } from 'hooks'
import { getTokenIcon } from 'lib/icons'
import { formatFloatTokenAmount } from 'lib/formatters'
import { ToolTip } from 'components/common'

const GasTank = () => {
    const [failedImg, setFailedImg] = useState([])
    const account = '0x1243e32...'

    const mockedData = [
        {
            address: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
            balance: 6.639823,
            balanceRaw: "6639823",
            balanceUSD: 6.63,
            decimals: 6,
            isHidden: false,
            network: "polygon",
            price: 0.999077,
            symbol: "USDT",
            tokenImageUrl: "https://assets.coingecko.com/coins/images/325/large/Tether-logo.png?1598003707",
            type: "base",
            updateAt: "Wed Apr 27 2022 11:35:29 GMT+0300 (Eastern European Summer Time)"
        },
        {
            address: "0xb468a1e5596cfbcdf561f21a10490d99b4bb7b68",
            balance: 1000,
            balanceRaw: "1000000000000000000000",
            balanceUSD: 0,
            decimals: 18,
            isHidden: false,
            network: "polygon",
            price: 0,
            symbol: "ELMO",
            tokenImageUrl: "https://logos.covalenthq.com/tokens/137/0xb468a1e5596cfbcdf561f21a10490d99b4bb7b68.png",
            type: "base",
            updateAt: "Wed Apr 27 2022 11:35:29 GMT+0300 (Eastern European Summer Time)"
        },
        {
            address: "0xe9415e904143e42007865e6864f7f632bd054a08",
            balance: 15,
            balanceRaw: "15000000000000000000",
            balanceUSD: 0,
            decimals: 18,
            isHidden: false,
            network: "polygon",
            price: 0,
            symbol: "WALLET",
            tokenImageUrl: "https://logos.covalenthq.com/tokens/137/0xe9415e904143e42007865e6864f7f632bd054a08.png",
            type: "base",
            updateAt: "Wed Apr 27 2022 11:35:29 GMT+0300 (Eastern European Summer Time)"
        }
    ]
    const mockedTxns = [
        {
            dateTime: '2022-03-01 12:32',
            gasPayed: '11.32',
            saved: '1.23',
            chargeBack: '0.23'
        },
        {
            dateTime: '2022-02-21 10:11',
            gasPayed: '10.00',
            saved: '0.91',
            chargeBack: '0.13'
        },
        {
            dateTime: '2022-01-01 02:32',
            gasPayed: '15.32',
            saved: '2.23',
            chargeBack: '0.66'
        }
    ]
    const [userSorting, setUserSorting] = useState({tokens: {sortType: 'custom'}})
    const sortType = userSorting.tokens?.sortType || 'decreasing'

    const isMobileScreen = useCheckMobileScreen()

    const onDropEnd = (list) => {        
        setUserSorting(
            prev => ({
                ...prev,
                tokens: {
                    sortType: 'custom',
                    items: {
                        ...prev.tokens?.items,
                        [`${account}`]: list
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

    const [isGasTankEnabled, setIsGasTankEnabled] = useState(false)
    const toggleGasTank = () => {
        setIsGasTankEnabled(prevState => !prevState)
    }

  
    const tokenItem = (index, img, symbol, balance, balanceUSD, address, send = false, network, decimals, category, sortedTokensLength) => 
        {
            const logo = failedImg.includes(img) ? getTokenIcon(network, address) : img
                
            return (<div className="token" key={`token-${address}-${index}`}
             draggable={category === 'tokens' && sortedTokensLength > 1 && sortType === 'custom' && !isMobileScreen}
             onDragStart={(e) => { 
                if (handle.current === target.current || handle.current.contains(target.current)) dragStart(e, index)
                else e.preventDefault();
             }}
             onMouseDown={(e) => dragTarget(e, index)}
             onDragEnter={(e) => dragEnter(e, index)}
             onDragEnd={() => drop(mockedData)}
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
                { symbol }
            </div>
            <div className="separator"></div>
            <div className="balance">
                <div className="currency">
                    <span className="value">{ formatFloatTokenAmount(balance, true, decimals) }</span>
                    <span className="symbol">{ symbol }</span>
                </div>
                <div className="dollar">
                    <span className="symbol">$</span> { balanceUSD.toFixed(2) }
                </div>
            </div>
            {
                send ? 
                    <div className="actions">
                        {/* TODO: Should opens GasTankDepositModal */}
                        <NavLink to={`/wallet/transfer/${address}`}>
                            <Button small>Deposit</Button>
                        </NavLink>
                    </div>
                    :
                    null
            }
        </div>)}

    return (
        <div id="gas-tank">
            <div className='heading-wrapper'>
                <div className="balance-wrapper">
                    <span><FaGasPump/> Gas Tank Balance</span>
                    <div><span>$</span>250.23</div>
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
                Balance by tokens
                {mockedData.length > 1 && !isMobileScreen &&  (
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
                    mockedData.map(({ address, symbol, tokenImageUrl, balance, balanceUSD, network, decimals }, i) =>
                        tokenItem(i, tokenImageUrl, symbol, balance, balanceUSD, address, true, network, decimals, 'tokens', mockedData.length))
                }
            </div>
            {/* Transactions here */}
            <div>
                {
                    mockedTxns.map((item, key) => {
                        return (<div key={key} className="txns-wapper">
                            <span>{item.dateTime}</span>
                            <span>Gas payed: {item.gasPayed}</span>
                            <span>Saved: {item.saved}</span>
                            <span>Chargeback: {item.chargeBack}</span>
                        </div>)
                    })
                }
            </div>
            <div>
                <Button className='deposit-button' small>Deposit to gas tank</Button>
            </div>
        </div>
    )
}

export default GasTank
