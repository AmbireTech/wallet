import './Dashboard.scss'

import { useLayoutEffect, useState } from 'react'
import { GiToken } from 'react-icons/gi'

import { Chart, Loading } from '../../common'

export default function Dashboard({ portfolio }) {
    const [chartData, setChartData] = useState([]);

    useLayoutEffect(() => {
        const total = portfolio.tokens.map(({ balanceUSD }) => balanceUSD).reduce((acc, curr) => acc + curr, 0);
        const chartData = portfolio.tokens
            .map(({ label, balanceUSD }) => ({
                label,
                value: balanceUSD
            }))
            .map(({ label, value }) => ({
                label,
                value: Number(((value / total) * 100).toFixed(2))
            }))
            .filter(({ value }) => value > 0);

        setChartData(chartData);
    }, [portfolio.totalUSD, portfolio.tokens]);

    return (
        <section id="dashboard">
            <div id="overview">
                <div id="balance" className="panel">
                    <div className="title">Balance</div>
                    <div className="content">
                        {
                            portfolio.isLoading ? 
                                <Loading/>
                                :
                                <div id="total">
                                    <span className="green-highlight">$</span> { portfolio.totalUSD.formated }
                                    <span className="green-highlight">.{ portfolio.totalUSD.decimals }</span>
                                </div>
                        }
                    </div>
                </div>
                <div id="chart" className="panel">
                    <div className="title">Balance by token</div>
                    <div className="content">
                        {
                            portfolio.isLoading ? 
                                <Loading/>
                                :
                                <Chart data={chartData} size={200}/>
                        }
                    </div>
                </div>
            </div>
            <div id="table" className="panel">
                <div className="title">Assets</div>
                <div className="content">
                    {
                        portfolio.isLoading ?
                            <Loading/>
                            :
                            portfolio.assets.map(({ label, assets }, i) => (
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

                <div className="powered">
                    Powered by Zapper
                </div>
            </div>
        </section>
    )
}