import './Assets.scss'

import { GiToken } from 'react-icons/gi'
import { AiOutlineSend } from 'react-icons/ai'
import { NavLink } from 'react-router-dom'
import { Button } from '../../../common'
import AssetsPlaceholder from './AssetsPlaceholder/AssetsPlaceholder'

const Assets = ({ assets }) => {
    return (
        <div id="assets-table">
            {
                !assets.length ?
                    <AssetsPlaceholder/>
                    :
                    assets.map(({ label, assets }, i) => (
                            <div className="category" key={`category-${i}`}>
                                <div className="title">{ label }</div>
                                <div className="list">
                                    {
                                        assets.map(({ tokens }) => 
                                            tokens.map(({ label, collectionName, symbol, img, collectionImg, balance, balanceUSD, address }, i) => (
                                                <div className="token" key={`token-${i}`}>
                                                    <div className="icon">
                                                        {
                                                            img || collectionImg ? 
                                                                <img src={img || collectionImg} alt="Token Icon"/>
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
                                                    <div className="actions">
                                                        <NavLink to={`/wallet/transfer/${address}`}>
                                                            <Button small icon={<AiOutlineSend/>}>Send</Button>
                                                        </NavLink>
                                                    </div>
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

export default Assets