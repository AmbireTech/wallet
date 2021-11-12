import './Dashboard.scss'

import { useEffect, useLayoutEffect, useState } from 'react'

import { Chart, Loading, Segments } from '../../common'
import Assets from './Assets/Assets'
import Collectables from './Collectables/Collectables'
import networks from '../../../consts/networks'

export default function Dashboard({ portfolio, setNetwork }) {
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
            value: 'Tokens'
        },
        {
            value: 'Collectables'
        }
    ]

    const networkDetails = (network) => networks.find(({ id }) => id === network)

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
                                                total.full > 0 ?
                                                    <div className="other-balance" key={network} onClick={() => setNetwork(network)}>
                                                        You also have <span className="purple-highlight">$</span> { total.truncated }
                                                        <span className="purple-highlight">.{total.decimals}</span> on { networkDetails(network).name }
                                                    </div>
                                                    :
                                                    null
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
                            tableType === tableSegments[0].value ?
                                <Assets assets={portfolio.assets}/>
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