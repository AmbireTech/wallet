import './Assets.scss'

import { GiToken } from 'react-icons/gi'
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
                                            tokens.map(({ label, collectionName, symbol, img, collectionImg, balance, balanceUSD }, i) => (
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
                                                            <span className="symbol">$</span> { balanceUSD }
                                                        </div>
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