import { useHistory } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { MdDragIndicator, MdOutlineSort } from 'react-icons/md'

import { useModals, useCheckMobileScreen, useDragAndDrop } from 'hooks'
import { Loading } from 'components/common'
import { ToolTip } from 'components/common'
import TokensPlaceholder from './TokensPlaceholder/TokensPlaceholder'
import Token from './Token/Token'
import TokensWrapper from './TokensWrapper/TokensWrapper'
import AddOrHideTokenButton from './AddOrHideTokenButton/AddOrHideTokenButton'
import AddOrHideTokenModal from 'components/Modals/AddOrHideTokenModal/AddOrHideTokenModal'

import styles from './Tokens.module.scss'

const Tokens = ({ portfolio, network, account, hidePrivateValue, userSorting, setUserSorting }) => {
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
                /> : null
            }
            <>
                {
                    isCurrNetworkBalanceLoading ? <Loading/> : ((!shouldShowPlaceholder && sortedTokens.length) ? <TokensWrapper
                        titleSpacedLeft={sortType === "custom" && !isMobileScreen}
                        tokenLabelChildren={sortedTokens.length > 1 && !isMobileScreen &&  (
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
                    >
                        { 
                            sortedTokens.map(({ address, symbol, tokenImageUrl, balance, balanceUSD, network, decimals, pending, unconfirmed, latest, price }, i) => (
                                <Token
                                    key={address}
                                    index={i}
                                    img={tokenImageUrl}
                                    symbol={symbol}
                                    balance={balance}
                                    balanceUSD={balanceUSD}
                                    address={address}
                                    send={true}
                                    network={network}
                                    pending={pending}
                                    unconfirmed={unconfirmed}
                                    latest={latest}
                                    price={price}
                                    decimals={decimals}
                                    category="tokens"
                                    sortedTokens={sortedTokens}
                                    hidePrivateValue={hidePrivateValue}
                                    sortType={sortType}
                                    isMobileScreen={isMobileScreen}
                                    dragAndDrop={dragAndDrop}
                                />
                        ))}
                        <AddOrHideTokenButton openAddOrHideTokenModal={openAddOrHideTokenModal} />
                    </TokensWrapper> : null)
                }
            </>
        </div>
    )
}

export default Tokens