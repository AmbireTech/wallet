import { useEffect, useState } from 'react'
import './Dashboard.css'

export default function Dashboard({ balances }) {
    const [positiveBalances, setPositivesBalances] = useState([]);

    useEffect(() => {
        setPositivesBalances(balances.filter(({ products }) => products && products.length));
    }, [balances]);

    return (
        <section id="dashboard">
            <div id="table" className="panel">
            {
                positiveBalances.map(({ appId, products }) => 
                    products.map(({ label, assets }) => (
                        <div className="category" key={appId}>
                            <div className="title">{ label }</div>
                            <div className="list">
                                {
                                    assets.map(({ tokens }) => 
                                        tokens.map(({ label, symbol, img, balance, balanceUSD }) => (
                                            <div className="token">
                                                <div className="icon">
                                                    <img src={img}/>
                                                </div>
                                                <div className="name">
                                                    { label }
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
                    )
                ))
            }
            </div>
        </section>
    )
}