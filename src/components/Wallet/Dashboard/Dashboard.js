import './Dashboard.scss'

import { useLayoutEffect, useState } from 'react'
import { GiToken } from 'react-icons/gi'

import { Chart, Loading, Segments } from '../../common'
import AssetsPlaceholder from './AssetsPlaceholder/AssetsPlaceholder'

export default function Dashboard({ portfolio, setNetwork }) {
    const [chartTokensData, setChartTokensData] = useState([]);
    const [chartAssetsData, setChartAssetsData] = useState([]);
    const [chartType, setChartType] = useState([]);

    const chartSegments = [
        {
            value: 'By Token'
        },
        {
            value: 'By Asset'
        }
    ]

    useLayoutEffect(() => {
        const tokensData = portfolio.balance.tokens
            .map(({ label, balanceUSD }) => ({
                label,
                value: Number(((balanceUSD / portfolio.balance.total.full) * 100).toFixed(2))
            }))
            .filter(({ value }) => value > 0);

        const totalAssets = portfolio.assets.map(({ assets }) => 
            assets
                .map(({ balanceUSD }) => balanceUSD)
                .reduce((acc, curr) => acc + curr, 0))
            .reduce((acc, curr) => acc + curr, 0)

        const assetsData = portfolio.assets
            .map(({ label, assets }) => ({
                label,
                value: Number(((assets.map(({ balanceUSD }) => balanceUSD).reduce((acc, curr) => acc + curr, 0) / totalAssets) * 100).toFixed(2))
            }))
            .filter(({ value }) => value > 0)

        setChartTokensData(tokensData);
        setChartAssetsData(assetsData)
    }, [portfolio.balance, portfolio.assets]);

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
                                    <span className="green-highlight">$</span> { portfolio.balance.total.truncated }
                                    <span className="green-highlight">.{ portfolio.balance.total.decimals }</span>
                                    <div id="other-balances">
                                        {
                                            Object.entries(portfolio.otherBalances).map(([network, { total }]) => (
                                                <div className="balance" key={network} onClick={() => setNetwork(network)}>
                                                    $ { total.truncated }.{total.decimals} on { network }
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                        }
                    </div>
                </div>
                <div id="chart" className="panel">
                    <div className="title">
                        Balance by token
                        <Segments small defaultValue={chartSegments[0].value} segments={chartSegments} onChange={setChartType}/>
                    </div>
                    <div className="content">
                        {
                             portfolio.isLoading ? 
                                    <Loading/>
                                    :
                                    chartType === chartSegments[0].value ?
                                        <Chart data={chartTokensData} size={200}/>
                                        :
                                        <Chart data={chartAssetsData} size={200}/>
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
                            !portfolio.assets.length ?
                                <AssetsPlaceholder/>
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
                {
                    portfolio.isLoading || !portfolio.assets.length ?
                        null
                        :
                        <div className="powered">
                            Powered by Zapper
                        </div>
                }
            </div>
        </section>
    )
}