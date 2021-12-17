import './Protocols.scss'

import { GiToken } from 'react-icons/gi'
import { AiOutlineSend } from 'react-icons/ai'
import { NavLink } from 'react-router-dom'
import { Button, Loading } from '../../../common'
import ProtocolsPlaceholder from './ProtocolsPlaceholder/ProtocolsPlaceholder'
import { useState } from 'react'

const Protocols = ({ portfolio }) => {
    const [failedImg, setFailedImg] = useState([])

    const { isBalanceLoading, areProtocolsLoading, tokens, protocols } = portfolio
    const otherProtocols = protocols.filter(({ label }) => label !== 'Tokens')
    const shouldShowPlaceholder = (!isBalanceLoading && !tokens.length) && (!areProtocolsLoading && !otherProtocols.length)

    return (
        <div id="protocols-table">
            {
                shouldShowPlaceholder ?
                    <ProtocolsPlaceholder/>
                    :
                    null
            }
            <>
                {
                    isBalanceLoading ?
                        <Loading/>
                        :
                        !shouldShowPlaceholder && tokens.length ?
                            <div className="category" key="category-tokens">
                                <div className="title">Tokens</div>
                                <div className="list">
                                    {
                                        tokens.map(({ address, symbol, tokenImageUrl, balance, balanceUSD }, i) => (
                                            <div className="token" key={`token-${i}`}>
                                                <div className="icon">
                                                    { 
                                                        failedImg.includes(tokenImageUrl) ?
                                                            <GiToken size={20}/>
                                                            :
                                                            <img src={tokenImageUrl} draggable="false" alt="Token Icon" onError={() => setFailedImg(failed => [...failed, tokenImageUrl])}/>
                                                    }
                                                </div>
                                                <div className="name">
                                                    { symbol }
                                                </div>
                                                <div className="separator"></div>
                                                <div className="balance">
                                                    <div className="currency">
                                                        <span className="value">{ balance }</span>
                                                        <span className="symbol">{ symbol }</span>
                                                    </div>
                                                    <div className="dollar">
                                                        <span className="symbol">$</span> { balanceUSD.toFixed(2) }
                                                    </div>
                                                </div>
                                                <div className="actions">
                                                    <NavLink to={`/wallet/transfer/${address}`}>
                                                        <Button small icon={<AiOutlineSend/>}>Send</Button>
                                                    </NavLink>
                                                </div>
                                            </div>
                                        ))
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
                                            assets.map(({ type, tokens }) => 
                                                tokens.map(({ label, collectionName, symbol, img, collectionImg, tokenImageUrl, balance, balanceUSD, address }, i) => (
                                                    <div className="token" key={`token-${i}`}>
                                                        <div className="icon">
                                                            <div className="icon-overlay" style={{backgroundImage: `url(${img || collectionImg || tokenImageUrl})`}}/>
                                                            <GiToken size={20}/>
                                                        </div>
                                                        <div className="name">
                                                            { label || collectionName || symbol }
                                                        </div>
                                                        <div className="separator"></div>
                                                        <div className="balance">
                                                            <div className="currency">
                                                                <span className="value">{ balance }</span>
                                                                <span className="symbol">{ symbol }</span>
                                                            </div>
                                                            <div className="dollar">
                                                                <span className="symbol">$</span> { balanceUSD.toFixed(2) }
                                                            </div>
                                                        </div>
                                                        {
                                                            type === 'wallet' ?
                                                                <div className="actions">
                                                                    <NavLink to={`/wallet/transfer/${address}`}>
                                                                        <Button small icon={<AiOutlineSend/>}>Send</Button>
                                                                    </NavLink>
                                                                </div>
                                                                :
                                                                null
                                                        }
                                                    </div>
                                                ))
                                            )
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