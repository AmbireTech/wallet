import { useHistory } from 'react-router-dom'
import { Loading } from 'components/common'
import ProtocolsPlaceholder from './ProtocolsPlaceholder/ProtocolsPlaceholder'
import { useCallback, useEffect, useState } from 'react'
import { MdDragIndicator, MdOutlineSort } from 'react-icons/md'
import AddTokenModal from 'components/Modals/AddTokenModal/AddTokenModal'
import { useModals, useCheckMobileScreen, useDragAndDrop } from 'hooks'
import HideTokenModel from 'components/Modals/HideTokenModal/HideTokenModal'

import { ToolTip } from 'components/common'

import styles from './Protocols.module.scss'
import Protocol from './Protocol/Protocol'

const Protocols = ({ portfolio, network, account, hidePrivateValue, userSorting, setUserSorting }) => {
    const history = useHistory()
    const { showModal } = useModals()
    console.log(portfolio)

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


    const otherProtocols = protocols.filter(({ label }) => label !== 'Tokens')
    const shouldShowPlaceholder = (!isCurrNetworkBalanceLoading && !tokens.length) && (!isCurrNetworkProtocolsLoading && !otherProtocols.length)

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
                                        Token
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
                                    <h3 className={styles.balance}>
                                        Balance
                                    </h3>
                                    <h3 className={styles.price}>
                                        Price
                                    </h3>
                                    <h3 className={styles.value}>
                                        Value
                                    </h3>
                                    {/* <h3 className={styles.pending}>
                                        Pending
                                    </h3>
                                    <h3 className={styles.pending}>
                                        Pending+
                                    </h3> */}
                                    <div className={styles.actions}>
                                        Actions
                                    </div>
                                </div>
                                <div className={styles.list}>
                                    { 
                                        sortedTokens.map(({ address, symbol, tokenImageUrl, balance, balanceUSD, network, decimals, price }, i) => {
                                            return (
                                            <Protocol
                                                key={address}
                                                index={i}
                                                img={tokenImageUrl}
                                                symbol={symbol}
                                                balance={balance}
                                                balanceUSD={balanceUSD}
                                                address={address}
                                                send={true}
                                                network={network}
                                                price={price}
                                                decimals={decimals}
                                                category="tokens"
                                                sortedTokens={sortedTokens}
                                                hidePrivateValue={hidePrivateValue}
                                                sortType={sortType}
                                                isMobileScreen={isMobileScreen}
                                                dragAndDrop={dragAndDrop}
                                            />
                                    )})}
                                </div>
                            </div>
                        :
                        null
                }
                {/* {
                    isCurrNetworkProtocolsLoading ?
                        <Loading/>
                        :
                            otherProtocols.map(({ label, assets }, i) => (
                                <div className={styles.category} key={`category-${i}`}>
                                    <div className={styles.title}>{ label }</div>
                                    <div className={styles.list}>
                                        {
                                            assets.map(({ category, symbol, tokenImageUrl, balance, balanceUSD, address, price }, i) => (
                                                <Protocol
                                                    index={i}
                                                    img={tokenImageUrl}
                                                    symbol={symbol}
                                                    balance={balance}
                                                    balanceUSD={balanceUSD}
                                                    address={address}
                                                    send={category !== 'claimable'}
                                                    network={network}
                                                    price={price}
                                                    category="protocols"
                                                    sortedTokens={sortedTokens}
                                                    hidePrivateValue={hidePrivateValue}
                                                    sortType={sortType}
                                                    isMobileScreen={isMobileScreen}
                                                    dragAndDrop={dragAndDrop}
                                                />
                                        ))}
                                    </div>
                                </div>
                            ))
                } */}
            </>
        </div>
    )
}

export default Protocols