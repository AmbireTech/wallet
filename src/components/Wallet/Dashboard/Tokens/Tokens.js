import { useHistory } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { MdDragIndicator, MdOutlineSort } from 'react-icons/md'

import { useModals, useCheckMobileScreen, useDragAndDrop } from 'hooks'
import { Loading } from 'components/common'
import { ToolTip } from 'components/common'
import TokensPlaceholder from './TokensPlaceholder/TokensPlaceholder'
import Token from './Token/Token'
import TokensWrapper from './TokensWrapper/TokensWrapper'
import AddOrHideButton from 'components/Wallet/Dashboard/AddOrHideButton/AddOrHideButton'
import AddOrHideTokenModal from 'components/Modals/AddOrHideTokenModal/AddOrHideTokenModal'

import styles from './Tokens.module.scss'
import { formatFloatTokenAmount } from 'lib/formatters'
import Pending from './Token/Pending/Pending'

const Tokens = ({ portfolio, network, account, hidePrivateValue, userSorting, setUserSorting, footer }) => {
    const history = useHistory()
    const { showModal } = useModals()

    const [addOrHideTokenModal, setAddOrHideTokenModal] = useState({
        isOpen: false,
        defaultSection: 'Add Token'
    })
    const { isCurrNetworkBalanceLoading, tokens } = portfolio
    
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

    const dragAndDrop = useDragAndDrop(
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


    const shouldShowPlaceholder = (!isCurrNetworkBalanceLoading && !tokens.length)
    const handleModalVisiblity = useCallback((value) => setAddOrHideTokenModal((prev) => ({...prev, isOpen: value})), [setAddOrHideTokenModal])

    const openAddOrHideTokenModal = useCallback(() => handleModalVisiblity(true), [handleModalVisiblity])

    useEffect(() => {
        if(addOrHideTokenModal.isOpen) {
            showModal(
                <AddOrHideTokenModal
                    portfolio={portfolio} 
                    account={account} 
                    userSorting={userSorting}
                    sortType={sortType}
                    network={network} 
                    handleModalVisiblity={handleModalVisiblity} 
                    defaultSection={addOrHideTokenModal.defaultSection}
                />
            )
        }
    }, [portfolio, addOrHideTokenModal, handleModalVisiblity, showModal, account, network, sortType, userSorting])

    useEffect(() => history.replace(`/wallet/dashboard`), [history])

    return (
        <div className={styles.wrapper}>
            {
                shouldShowPlaceholder ? <TokensPlaceholder
                    onClickAddToken={() => setAddOrHideTokenModal({isOpen: true, defaultSection: 'Add Token'})} 
                    onClickShowToken={() => setAddOrHideTokenModal({isOpen: true, defaultSection: 'Hide Token'})}
                    footer={footer}
                /> : null
            }
            <>
                {
                    isCurrNetworkBalanceLoading ? <Loading/> : ((!shouldShowPlaceholder && sortedTokens.length) ? <TokensWrapper
                        titleSpacedLeft={sortType === "custom" && !isMobileScreen}
                        tokenLabelChildren={sortedTokens.length > 1 && !isMobileScreen &&  (
                            <div className={styles.sortButtons}>
                                <ToolTip label='Sorted tokens by drag and drop'>
                                    <MdDragIndicator color={sortType === "custom" ? "#27e8a7" : ""} cursor="pointer" onClick={() => setUserSorting(prev => ({
                                        ...prev,
                                        tokens: {
                                            ...prev.tokens,
                                            sortType: 'custom'
                                        }
                                    }))} />
                                </ToolTip>
                                <ToolTip label='Sorted tokens by DESC balance'>
                                    <MdOutlineSort color={sortType === "decreasing" ? "#27e8a7" : ""} cursor="pointer" onClick={() => setUserSorting(prev => ({
                                        ...prev,
                                        tokens: {
                                            ...prev.tokens,
                                            sortType: 'decreasing'
                                        }
                                    }))} />
                                </ToolTip>
                            </div>
                        )}
                    >
                        { 
                            sortedTokens.map(({ address, symbol, tokenImageUrl, balance, balanceUSD, network, decimals, pending, unconfirmed, latest, price }, index) => {
                                const {
                                    dragStart,
                                    dragEnter,
                                    target,
                                    handle,
                                    dragTarget,
                                    drop
                                } = dragAndDrop

                                return (
                                    <Token
                                        key={address}
                                        address={address}
                                        network={network}
                                        wrapperEndChildren={
                                            <Pending
                                                balance={balance}
                                                hidePrivateValue={hidePrivateValue}
                                                decimals={decimals}
                                                pending={pending}
                                                unconfirmed={unconfirmed}
                                                latest={latest}
                                                extraMargin={sortType === "custom" && sortedTokens.length > 1 && !isMobileScreen}
                                            />
                                        }
                                        // Token data
                                        img={tokenImageUrl}
                                        symbol={symbol}
                                        balance={hidePrivateValue(formatFloatTokenAmount(Number(balance).toFixed((balance < 1) ? 8 : 4), true, decimals))}
                                        pending={pending}
                                        unconfirmed={unconfirmed}
                                        value={hidePrivateValue(formatFloatTokenAmount(latest ? latest.balanceUSD : balanceUSD, true, decimals))}
                                        price={`$${price ? hidePrivateValue(price.toFixed((price < 1) ? 5 : 2)) : '-'}`}
                                        // Actions
                                        sendUrl={`/wallet/transfer/${address}`}
                                        // Drag props
                                        bodyChildren={sortedTokens.length > 1 && sortType === 'custom' && !isMobileScreen && <MdDragIndicator 
                                                size={20} 
                                                className={styles.dragHandle} 
                                                onClick={(e) => dragStart(e, index)} id={`${index}-handle`} 
                                            />
                                        }
                                        draggable={sortedTokens.length > 1 && sortType === 'custom' && !isMobileScreen}
                                        onDragStart={(e) => { 
                                            if (handle.current === target.current || handle.current.contains(target.current)) dragStart(e, index)
                                            else e.preventDefault();
                                        }}
                                        onMouseDown={(e) => dragTarget(e, index)}
                                        onDragEnter={(e) => dragEnter(e, index)}
                                        onDragEnd={() => drop(sortedTokens)}
                                        onDragOver={(e) => e.preventDefault()}
                                    />
                                )
                        })}
                        <AddOrHideButton onClick={openAddOrHideTokenModal}>
                            Add or Hide Token
                        </AddOrHideButton>
                        { footer }
                    </TokensWrapper> : null)
                }
            </>
        </div>
    )
}

export default Tokens