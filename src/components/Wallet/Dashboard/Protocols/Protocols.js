import './Protocols.scss'

import { GiToken } from 'react-icons/gi'
import { AiOutlineSend } from 'react-icons/ai'
import { NavLink } from 'react-router-dom'
import { Button } from '../../../common'
import ProtocolsPlaceholder from './ProtocolsPlaceholder/ProtocolsPlaceholder'

const Protocols = ({ protocols }) => {
    return (
        <div id="protocols-table">
            {
                !protocols.length ?
                    <ProtocolsPlaceholder/>
                    :
                    protocols.map(({ label, assets }, i) => (
                            <div className="category" key={`category-${i}`}>
                                <div className="title">{ label }</div>
                                <div className="list">
                                    {
                                        assets.map(({ type, tokens }) => 
                                            tokens.map(({ label, collectionName, symbol, img, collectionImg, tokenImageUrl, balance, balanceUSD, address }, i) => (
                                                <div className="token" key={`token-${i}`}>
                                                    <div className="icon">
                                                        {
                                                            img || collectionImg || tokenImageUrl ?
                                                                <img src={img || collectionImg || tokenImageUrl} alt="Token Icon"/>
                                                                :
                                                                <GiToken size={20}/>
                                                        }
                                                    </div>
                                                    <div className="name">
                                                        { label || collectionName || symbol }
                                                    </div>
                                                    <div className="separator"></div>
                                                    <div className="balance">
                                                        <div className="currency">
                                                            { balance } <span className="symbol">{ symbol }</span>
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
        </div>
    )
}

export default Protocols