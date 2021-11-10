import './Dashboard.scss'

import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { GiToken } from 'react-icons/gi'

import { Chart, Loading, Segments } from '../../common'
import AssetsPlaceholder from './AssetsPlaceholder/AssetsPlaceholder'
import Collectables from './Collectables/Collectables'

export default function Dashboard({ portfolio, allNetworks, setNetwork }) {
    const [chartTokensData, setChartTokensData] = useState([]);
    const [chartAssetsData, setChartAssetsData] = useState([]);
    const [chartType, setChartType] = useState([]);
    const [tableType, setTableType] = useState([]);

    const chartSegments = [
        {
            value: 'By Token'
        },
        {
            value: 'By Asset'
        }
    ]

    const tableSegments = [
        {
            value: 'Portfolio'
        },
        {
            value: 'Collectables'
        }
    ]

    const networkDetails = useCallback((network) => allNetworks.find(({ id }) => id === network), [allNetworks])

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

    useEffect(() => portfolio.requestOtherProtocolsRefresh(), [portfolio])

    return (
        <section id="dashboard">
            <div id="overview">
                <div id="balance" className="panel">
                    <div className="title">Balance</div>
                    <div className="content">
                        {
                            portfolio.isBalanceLoading ? 
                                <Loading/>
                                :
                                <div id="total">
                                    <span className="green-highlight">$</span> { portfolio.balance.total.truncated }
                                    <span className="green-highlight">.{ portfolio.balance.total.decimals }</span>
                                    <div id="other-balances">
                                        {
                                            portfolio.otherBalances.map(({ network, total }) => (
                                                <div className="balance" key={network} onClick={() => setNetwork(network)}>
                                                    <span className="purple-highlight">$</span> { total.truncated }
                                                    <span className="purple-highlight">.{total.decimals}</span> on { networkDetails(network).name }
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
                        Balance by
                        <Segments small defaultValue={chartSegments[0].value} segments={chartSegments} onChange={setChartType}/>
                    </div>
                    <div className="content">
                        {
                            chartType === chartSegments[0].value ?
                                portfolio.isBalanceLoading ?
                                    <Loading/>
                                    :
                                    <Chart data={chartTokensData} size={200}/>
                                :
                                portfolio.areAssetsLoading ?
                                    <Loading/>
                                    :
                                    <Chart data={chartAssetsData} size={200}/>
                        }
                    </div>
                </div>
            </div>
            <div id="table" className="panel">
                <div className="title">
                    Assets
                    <Segments small defaultValue={tableSegments[0].value} segments={tableSegments} onChange={setTableType}></Segments>
                </div>
                <div className="content">
                    {
                        portfolio.areAssetsLoading ?
                            <Loading/>
                            :
                            !portfolio.assets.length ?
                                <AssetsPlaceholder/>
                                :
                                tableType === tableSegments[0].value ?
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
                                    :
                                    <Collectables collectables={portfolio.collectables}/>
                    }
                </div>
                {
                    portfolio.areAssetsLoading || !portfolio.assets.length ?
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