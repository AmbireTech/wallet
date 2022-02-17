import './Protocols.scss'

import { GiToken } from 'react-icons/gi'
import { AiOutlineSend } from 'react-icons/ai'
import { NavLink } from 'react-router-dom'
import { Button, Loading } from 'components/common'
import ProtocolsPlaceholder from './ProtocolsPlaceholder/ProtocolsPlaceholder'
import { useState } from 'react'
import { MdOutlineAdd, MdVisibilityOff } from 'react-icons/md'
import { AddTokenModal } from 'components/Modals'
import { useModals } from 'hooks'
import { HideTokenModel } from 'components/Modals'

const Protocols = ({ portfolio, network, account, hidePrivateValue }) => {
    const { showModal } = useModals()

    const [failedImg, setFailedImg] = useState([])

    const { isBalanceLoading, areProtocolsLoading, tokens, protocols } = portfolio
    const sortedTokens = tokens.sort((a, b) => {
        const decreasing = b.balanceUSD - a.balanceUSD
        if (decreasing === 0) return a.symbol.localeCompare(b.symbol)
        return decreasing
    })
    const otherProtocols = protocols.filter(({ label }) => label !== 'Tokens')
    const shouldShowPlaceholder = (!isBalanceLoading && !tokens.length) && (!areProtocolsLoading && !otherProtocols.length)

    const tokenItem = (index, img, symbol, balance, balanceUSD, address, send = false) => 
        <div className="token" key={`token-${address}-${index}`}>
            <div className="icon">
                { 
                    failedImg.includes(img) ?
                        <GiToken size={20}/>
                        :
                        <img src={img} draggable="false" alt="Token Icon" onError={() => setFailedImg(failed => [...failed, img])}/>
                }
            </div>
            <div className="name">
                { symbol }
            </div>
            <div className="separator"></div>
            <div className="balance">
                <div className="currency">
                    <span className="value">{ hidePrivateValue(balance) }</span>
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
        </div>

    const openAddTokenModal = () => showModal(<AddTokenModal network={network} account={account} portfolio={portfolio} />)
    const openHideTokenModal = () => showModal(<HideTokenModel network={network} account={account} portfolio={portfolio} />)

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
                                    Tokens
                                    <div className="wrapper-btns">
                                        <Button mini clear icon={<MdVisibilityOff/>} onClick={() => openHideTokenModal()}>Hide Token</Button>
                                        <Button mini clear icon={<MdOutlineAdd/>} onClick={() => openAddTokenModal()}>Add Token</Button>
                                    </div>
                                </div>
                                <div className="list">
                                    { 
                                        sortedTokens.map(({ address, symbol, tokenImageUrl, balance, balanceUSD }, i) =>
                                            tokenItem(i, tokenImageUrl, symbol, balance, balanceUSD, address, true))
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
                                                tokenItem(i, tokenImageUrl, symbol, balance, balanceUSD, address, category !== 'claimable'))
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