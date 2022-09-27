import useGasTankData from 'ambire-common/src/hooks/useGasTankData'

import './GasTank.scss'
import { Toggle } from 'components/common'
import { useState } from 'react'
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
// eslint-disable-next-line import/no-relative-parent-imports
import { useToasts } from '../../../../hooks/toasts'

const GasTank = ({ 
    network, 
    relayerURL, 
    portfolio, 
    account, 
    userSorting, 
    setUserSorting,
    gasTankState, 
    setGasTankState 
}) => {
    const {
        isLoading,
        balancesRes,
        gasTankBalances,
        totalSavedResult,
        gasTankFilledTxns,
        feeAssetsRes,
        availableFeeAssets
      } = useGasTankData({
        relayerURL,
        selectedAcc: account,
        network,
        portfolio,
        useRelayerData
      })

    const { showModal } = useModals()
    const { addToast } = useToasts()

    const gasTankBalancesFormatted = gasTankBalances ? formatFloatTokenAmount(gasTankBalances, true, 2) : '0.00'
    const feeAssetsPerNetwork = feeAssetsRes && feeAssetsRes.length && feeAssetsRes.filter(item => item.network === network.id)
    
    const totalSaved = totalSavedResult && totalSavedResult.length && 
        formatFloatTokenAmount(totalSavedResult.map(i => i.saved).reduce((a, b) => a + b), true, 2)
    const totalCashBack = totalSavedResult && totalSavedResult.length && 
        formatFloatTokenAmount(totalSavedResult.map(i => i.cashback).reduce((a, b) => a + b), true, 2)
        
    const { isBalanceLoading } = portfolio
    const sortType = userSorting.tokens?.sortType || 'decreasing'
    const isMobileScreen = useCheckMobileScreen()
    const [failedImg, setFailedImg] = useState([])
    const toLocaleDateTime = date => `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
    const sortedTokens = availableFeeAssets?.filter(item => !item.disableGasTankDeposit).sort((a, b) => b.balanceUSD - a.balanceUSD).sort((a, b) => {
        if (sortType === 'custom' && userSorting.tokens?.items?.[`${account}-${network.chainId}`]?.length) {
            const addressA = userSorting.tokens.items[`${account}-${network.chainId}`].indexOf(a.address.toLowerCase())
            const addressB = userSorting.tokens.items[`${account}-${network.chainId}`].indexOf(b.address.toLowerCase())
            const sorted = addressA - addressB
            return sorted
        } else {
            const decreasing = b.balanceUSD - a.balanceUSD
            if (decreasing === 0) return a.symbol.toUpperCase().localeCompare(b.symbol.toUpperCase())
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
            addToast('Add assets from the list to the Gas Tank to enable it.', { error: true })
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
                disabled={balance === 0}
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
                        <span className="value" >{ formatFloatTokenAmount(balance, true, 4) }</span>
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
                                    gasTankMsg: 'Warning: You are about to top up your Gas Tank. Top ups to the Gas Tank are non-refundable.',
                                    feeAssetsPerNetwork
                                }
                            }}>
                                <Button small>Top up</Button>
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
                    <span><GiGasPump/> Balance on All Networks</span>
                    { (!isLoading && gasTankBalances) ?
                        (<div className={ (gasTankBalancesFormatted.length > 6)? 'inner-wrapper-left small-font' : 'inner-wrapper-left' } >
                            <span>$ </span>{ gasTankBalancesFormatted }
                        </div>) : 
                        <Loading /> }
                    {/* TODO: Add functionality for drag and drop */}
                    {/* <span>Drag and drop tokens here</span> */}
                    <span>More details...</span>
                </div>
                <div className='switch-wrapper'>
                    <Toggle checked={currentAccGasTankState.isEnabled} onChange={() => toggleGasTank()}/>
                    {currentAccGasTankState.isEnabled ? <span>Enabled</span> : <span>Disabled</span>}
                </div>

                <div className="balance-wrapper total-save">
                    <div className='inner-wrapper-right'>
                        <div className='label green'>Total Saved: </div> 
                        <div className='amount'><span>$</span> {totalSaved ? totalSaved : '0.00'}</div>
                    </div>
                    <div className='inner-wrapper-right'>
                        <div className='label'>Total Cashback: </div> 
                        <div className='amount'><span>$</span> {totalCashBack ? totalCashBack : '0.00'}</div>
                    </div>
                    <span>From gas fees on {network.id.toUpperCase()}</span>
                </div>
            </div>
            <div>
                <p>This is your special account for pre-paying gas.</p>
                <p>By filling up your Gas Tank, you are setting aside, or prepaying for network fees.</p>
                <p>Only the tokens listed below are eligible for filling up your Gas Tank. You can add more tokens to your Gas Tank at any time.</p>
                <p>The tokens in your Gas Tank can pay network fees on all supported networks.</p>
            </div>
            <div className="sort-holder">
                <span className='title'>Available fee tokens on {network.id.toUpperCase()}</span>
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
            <div>
                <NavLink to={{
                    pathname: `/wallet/transfer/`,
                    state: {
                        gasTankMsg: 'Warning: You are about to top up your Gas Tank. Top ups to the Gas Tank are non-refundable.',
                        feeAssetsPerNetwork
                    }
                }}>
                    <Button className='deposit-button' small>top up gas tank</Button>
                </NavLink>
            </div>
            <span className='title'>Gas Tank top ups history on {network.id.toUpperCase()}</span>
            <p className='warning-msg'>Warning: It will take some time to top up the Gas Tank after the transaction is signed.</p>
            <div className="txns-wrapper">
                {
                    gasTankFilledTxns && gasTankFilledTxns.length ? gasTankFilledTxns.map((item, key) => {
                        const tokenDetails = feeAssetsRes && feeAssetsRes.length ? 
                            feeAssetsRes.find(({address, network}) => address.toLowerCase() === item.address.toLowerCase() && network === item.network) : null
                        if (!tokenDetails) return null // txn to gas Tank with not eligible token
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
                    }).filter(r => r) : <p>No top ups were made to Gas Tank on {network.id.toUpperCase()}</p>
                }
            </div>
        </div>
    )
}

export default GasTank
