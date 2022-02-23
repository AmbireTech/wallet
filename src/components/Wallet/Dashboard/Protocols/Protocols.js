import './Protocols.scss'

import { GiToken } from 'react-icons/gi'
import { AiOutlineSend } from 'react-icons/ai'
import { NavLink } from 'react-router-dom'
import { Button, Loading } from 'components/common'
import ProtocolsPlaceholder from './ProtocolsPlaceholder/ProtocolsPlaceholder'
import { useState } from 'react'
import { MdOutlineAdd } from 'react-icons/md'
import { AddTokenModal } from 'components/Modals'
import { useModals } from 'hooks'
import { getTokenIcon } from 'lib/icons'
import { formatFloatTokenAmount } from 'lib/formatters'

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

    const tokenItem = (index, img, symbol, balance, balanceUSD, address, send = false, network) => 
        {
            const logo = failedImg.includes(img) ? getTokenIcon(network, address) : img

            return (<div className="token" key={`token-${address}-${index}`}>
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
                    <span className="value">{ hidePrivateValue(formatFloatTokenAmount(balance, true, 2)) }</span>
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

    return (
        <div id="protocols-table">
            {
                shouldShowPlaceholder ?
                    <ProtocolsPlaceholder onClickAddToken={openAddTokenModal}/>
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
                                    <Button mini clear icon={<MdOutlineAdd/>} onClick={() => openAddTokenModal()}>Add Token</Button>
                                </div>
                                <div className="list">
                                    { 
                                        sortedTokens.map(({ address, symbol, tokenImageUrl, balance, balanceUSD, network }, i) =>
                                            tokenItem(i, tokenImageUrl, symbol, balance, balanceUSD, address, true, network))
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