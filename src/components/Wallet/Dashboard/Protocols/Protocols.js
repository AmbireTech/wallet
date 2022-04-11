import './Protocols.scss'

import { GiToken } from 'react-icons/gi'
import { AiOutlineSend } from 'react-icons/ai'
import { NavLink } from 'react-router-dom'
import { Button, Loading } from 'components/common'
import ProtocolsPlaceholder from './ProtocolsPlaceholder/ProtocolsPlaceholder'
import { useState, useRef, useEffect } from 'react'
import { MdOutlineAdd, MdVisibilityOff, MdDragIndicator } from 'react-icons/md'
import { BsSortNumericDownAlt } from 'react-icons/bs'
import { AddTokenModal } from 'components/Modals'
import { useModals, useLocalStorage } from 'hooks'
import { HideTokenModel } from 'components/Modals'
import { getTokenIcon } from 'lib/icons'
import { formatFloatTokenAmount } from 'lib/formatters'
import { ToolTip } from 'components/common'

const Protocols = ({ portfolio, network, account, hidePrivateValue }) => {
    const { showModal } = useModals()

    const [failedImg, setFailedImg] = useState([])
    const { isBalanceLoading, areProtocolsLoading, tokens, protocols } = portfolio
    const [userSortedTokens, setSortedTokens] = useLocalStorage({
        key: 'userSortedTokens',
        defaultValue: {}
    })

    const [chosenSort, setChosenSort] = useState(userSortedTokens[`${account}-${network.chainId}`] && userSortedTokens[`${account}-${network.chainId}`].length ? 'custom' : 'decreasing')

    const sortedTokens = tokens.sort((a, b) => {
        if (chosenSort === 'custom' && userSortedTokens[`${account}-${network.chainId}`] && userSortedTokens[`${account}-${network.chainId}`].length) {
            const sorted = userSortedTokens[`${account}-${network.chainId}`].indexOf(a.address) - userSortedTokens[`${account}-${network.chainId}`].indexOf(b.address)
            return sorted
        } else {
            const decreasing = b.balanceUSD - a.balanceUSD
            if (decreasing === 0) return a.symbol.localeCompare(b.symbol)
            return decreasing
        }
    })

    const otherProtocols = protocols.filter(({ label }) => label !== 'Tokens')
    
    const shouldShowPlaceholder = (!isBalanceLoading && !tokens.length) && (!areProtocolsLoading && !otherProtocols.length)
    const dragItem = useRef();
    const dragOverItem = useRef();

    const dragStart = (e, position) => dragItem.current = position;

    const dragEnter = (e, position) => dragOverItem.current = position;

    const drop = () => {
        const copyListItems = [...sortedTokens];
        const dragItemContent = copyListItems[dragItem.current];

        copyListItems.splice(dragItem.current, 1);
        copyListItems.splice(dragOverItem.current, 0, dragItemContent);

        dragItem.current = null;
        dragOverItem.current = null;

        const list = copyListItems.map(item => item.address)
        setChosenSort('custom')
        setSortedTokens({
            ...userSortedTokens,
            [`${account}-${network.chainId}`]: list
        })
    };

    const tokenItem = (index, img, symbol, balance, balanceUSD, address, send = false, network, decimals, category, sortedTokensLength) => 
        {
            const logo = failedImg.includes(img) ? getTokenIcon(network, address) : img
                
            return (<div className="token" key={`token-${address}-${index}`}
                draggable={category === 'tokens' && sortedTokensLength > 1}
                onDragStart={(e) => dragStart(e, index)}
                onDragEnter={(e) => dragEnter(e, index)}
                onDragEnd={drop}
                onDragOver={(e) => e.preventDefault()}
            >
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
                    <span className="value">{ hidePrivateValue(formatFloatTokenAmount(balance, true, decimals)) }</span>
                    <span className="symbol">{ symbol }</span>
                </div>
                <div className="dollar">
                    <span className="symbol">$</span> { hidePrivateValue(balanceUSD.toFixed(2)) }
                </div>
            </div>
            {
                send ? 
                    <div className="actions">
                        <NavLink to={`/wallet/transfer/${address}`}>
                            <Button small icon={<AiOutlineSend/>}>Send</Button>
                        </NavLink>
                    </div>
                    :
                    null
            }
        </div>)}

    const openAddTokenModal = () => showModal(<AddTokenModal network={network} account={account} portfolio={portfolio} />)
    const openHideTokenModal = () => showModal(<HideTokenModel network={network} account={account} portfolio={portfolio} />)


    useEffect(() => {
        if (userSortedTokens[`${account}-${network.chainId}`] && userSortedTokens[`${account}-${network.chainId}`].length) {
            setChosenSort('custom')
        } else {
            setChosenSort('decreasing')
        }
    }, [account, userSortedTokens, network])

    return (
        <div id="protocols-table">
            {
                shouldShowPlaceholder ?
                    <ProtocolsPlaceholder onClickAddToken={openAddTokenModal} onClickShowToken={openHideTokenModal}/>
                    :
                    null
            }
            <>
                {
                    isBalanceLoading ?
                        <Loading/>
                        :
                        !shouldShowPlaceholder && sortedTokens.length ?
                            <div className="category" key="category-tokens">
                                <div className="title">
                                    <div className="sort-holder">
                                        Tokens
                                        {sortedTokens.length > 1 && (
                                            <div className="sort-buttons">
                                                <ToolTip label='Sorted tokens by drag and drop'>
                                                    <MdDragIndicator color={chosenSort === "custom" ? "#80ffdb" : ""} cursor="pointer" onClick={() => setChosenSort('custom')} />
                                                </ToolTip>
                                                <ToolTip label='Sorted tokens by DESC balance'>
                                                    <BsSortNumericDownAlt color={chosenSort === "decreasing" ? "#80ffdb" : ""} cursor="pointer" onClick={() => setChosenSort('decreasing')} />
                                                </ToolTip>
                                            </div>
                                        )}
                                    </div>
                                    <div className="wrapper-btns">
                                        <Button mini clear icon={<MdVisibilityOff/>} onClick={() => openHideTokenModal()}>Hide Token</Button>
                                        <Button mini clear icon={<MdOutlineAdd/>} onClick={() => openAddTokenModal()}>Add Token</Button>
                                    </div>
                                </div>
                                <div className="list">
                                    { 
                                        sortedTokens.map(({ address, symbol, tokenImageUrl, balance, balanceUSD, network, decimals }, i) =>
                                            tokenItem(i, tokenImageUrl, symbol, balance, balanceUSD, address, true, network, decimals, 'tokens', sortedTokens.length))
                                    }
                                </div>
                            </div>
                        :
                        null
                }
                {
                    areProtocolsLoading ?
                        <Loading/>
                        :
                            otherProtocols.map(({ label, assets }, i) => (
                                <div className="category" key={`category-${i}`}>
                                    <div className="title">{ label }</div>
                                    <div className="list">
                                        {
                                            assets.map(({ category, symbol, tokenImageUrl, balance, balanceUSD, address }, i) => 
                                                tokenItem(i, tokenImageUrl, symbol, balance, balanceUSD, address, category !== 'claimable', 'protocols'))
                                        }
                                    </div>
                                </div>
                            ))
                }
            </>
        </div>
    )
}

export default Protocols