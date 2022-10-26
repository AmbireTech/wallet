import { useHistory } from 'react-router-dom'
import { GiToken } from 'react-icons/gi'
import { AiOutlineSend } from 'react-icons/ai'
import { NavLink } from 'react-router-dom'
import { Button, Loading } from 'components/common'
import ProtocolsPlaceholder from './ProtocolsPlaceholder/ProtocolsPlaceholder'
import { useCallback, useEffect, useState } from 'react'
import { MdOutlineAdd, MdVisibilityOff, MdDragIndicator, MdOutlineSort } from 'react-icons/md'
import AddTokenModal from 'components/Modals/AddTokenModal/AddTokenModal'
import { useModals, useDragAndDrop, useCheckMobileScreen } from 'hooks'
import HideTokenModel from 'components/Modals/HideTokenModal/HideTokenModal'
import { getTokenIcon } from 'lib/icons'
import { formatFloatTokenAmount } from 'lib/formatters'
import { ToolTip } from 'components/common'

import styles from './Protocols.module.scss'

const Protocols = ({ portfolio, network, account, hidePrivateValue, userSorting, setUserSorting }) => {
    const history = useHistory()
    const { showModal } = useModals()

    const [failedImg, setFailedImg] = useState([])
    const [isHideTokenModalOpen, setIsHideTokenModalOpen] = useState(false)
    const { isCurrNetworkBalanceLoading, isCurrNetworkProtocolsLoading, tokens, protocols } = portfolio

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
 
    const sortedTokens = tokens.sort((a, b) => {
        if (sortType === 'custom' && userSorting.tokens?.items?.[`${account}-${network.chainId}`]?.length) {
            const sorted = userSorting.tokens.items[`${account}-${network.chainId}`].indexOf(a.address) - userSorting.tokens.items[`${account}-${network.chainId}`].indexOf(b.address)
            return sorted
        } else {
            const decreasing = b.balanceUSD - a.balanceUSD
            if (decreasing === 0) return a.symbol.localeCompare(b.symbol)
            return decreasing
        }
    })


    const otherProtocols = protocols.filter(({ label }) => label !== 'Tokens')
    const shouldShowPlaceholder = (!isCurrNetworkBalanceLoading && !tokens.length) && (!isCurrNetworkProtocolsLoading && !otherProtocols.length)

    const tokenItem = (index, img, symbol, balance, balanceUSD, address, send = false, network, decimals, category, sortedTokensLength) => 
        {
            const logo = failedImg.includes(img) ? getTokenIcon(network, address) : img
                
            return (<div className={styles.token} key={`token-${address}-${index}`}
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
            {sortedTokensLength > 1 && sortType === 'custom' && !isMobileScreen && <MdDragIndicator size={20} className={styles.dragHandle} onClick={(e) => dragStart(e, index)} id={`${index}-handle`} />}
            <div className={styles.icon}>
                { 
                    failedImg.includes(logo) ?
                        <GiToken size={20}/>
                        :
                        <img src={logo} draggable="false" alt="Token Icon" onError={() => setFailedImg(failed => [...failed, logo])}/>
                }
            </div>
            <div className={styles.name}>
                { symbol }
            </div>
            <div className={styles.separator}></div>
            <div className={styles.balance}>
                <div className={styles.currency}>
                    <span className={styles.value}>{ hidePrivateValue(formatFloatTokenAmount(balance, true, decimals)) }</span>
                    <span className={styles.symbol}>{ symbol }</span>
                </div>
                <div className={styles.dollar}>
                    <span className={styles.symbol}>$</span> { hidePrivateValue(balanceUSD.toFixed(2)) }
                </div>
            </div>
            {
                send ? 
                    <div className={styles.actions}>
                        <NavLink to={`/wallet/transfer/${address}`}>
                            <Button small icon={<AiOutlineSend/>}>Send</Button>
                        </NavLink>
                    </div>
                    :
                    null
            }
        </div>)}

    const openAddTokenModal = useCallback(() => showModal(<AddTokenModal network={network} account={account} portfolio={portfolio} />), [account, network, portfolio, showModal])
    const openHideTokenModal = useCallback(() => setIsHideTokenModalOpen(true), [])

    useEffect(() => {
        if(isHideTokenModalOpen) {
            showModal(
                <HideTokenModel 
                    portfolio={portfolio} 
                    account={account} 
                    userSorting={userSorting}
                    sortType={sortType}
                    network={network} 
                    setIsHideTokenModalOpen={setIsHideTokenModalOpen} 
                />
            )
        }
    }, [portfolio, isHideTokenModalOpen, showModal, account, network, sortType, userSorting])

    useEffect(() => history.replace(`/wallet/dashboard`), [history])

    return (
        <div className={styles.wrapper}>
            {
                shouldShowPlaceholder ?
                    <ProtocolsPlaceholder onClickAddToken={openAddTokenModal} onClickShowToken={openHideTokenModal}/>
                    :
                    null
            }
            <>
                {
                    isCurrNetworkBalanceLoading ?
                        <Loading/>
                        :
                        !shouldShowPlaceholder && sortedTokens.length ?
                            <div className={styles.category} key="category-tokens">
                                <div className={styles.title}>
                                    <div className={styles.sortHolder}>
                                        Tokens
                                        {sortedTokens.length > 1 && !isMobileScreen &&  (
                                            <div className={styles.sortButtons}>
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
                                    <div className={styles.wrapperBtns}>
                                        <Button mini clear icon={<MdVisibilityOff/>} onClick={() => openHideTokenModal()}>Hide Token</Button>
                                        <Button mini clear icon={<MdOutlineAdd/>} onClick={() => openAddTokenModal()}>Add Token</Button>
                                    </div>
                                </div>
                                <div className={styles.list}>
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
                    isCurrNetworkProtocolsLoading ?
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