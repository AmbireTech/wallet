import './Dashboard.scss'

import { useEffect, useLayoutEffect, useState } from 'react'

import { Chart, Loading, Segments } from '../../common'
import Protocols from './Protocols/Protocols'
import Collectibles from './Collectibles/Collectibles'
import networks from '../../../consts/networks'

export default function Dashboard({ portfolio, selectedNetwork, setNetwork }) {

    const [chartTokensData, setChartTokensData] = useState([]);
    const [chartProtocolsData, setChartProtocolsData] = useState([]);
    const [chartType, setChartType] = useState([]);
    const [tableType, setTableType] = useState([]);

    const chartSegments = [
        {
            value: 'Tokens'
        },
        {
            value: 'Protocols'
        }
    ]

    const tableSegments = [
        {
            value: 'Tokens'
        },
        {
            value: 'Collectibles'
        }
    ]

    const networkDetails = (network) => networks.find(({ id }) => id === network)
    const otherBalances = portfolio.otherBalances.filter(({ network, total }) => network !== selectedNetwork.id && total.full > 0)

    useLayoutEffect(() => {
        const tokensData = portfolio.tokens
            .map(({ label, balanceUSD }) => ({
                label,
                value: Number(((balanceUSD / portfolio.balance.total.full) * 100).toFixed(2))
            }))
            .filter(({ value }) => value > 0);

        const totalProtocols = portfolio.protocols.map(({ assets }) => 
            assets
                .map(({ balanceUSD }) => balanceUSD)
                .reduce((acc, curr) => acc + curr, 0))
            .reduce((acc, curr) => acc + curr, 0)

        const protocolsData = portfolio.protocols
            .map(({ label, assets }) => ({
                label,
                value: Number(((assets.map(({ balanceUSD }) => balanceUSD).reduce((acc, curr) => acc + curr, 0) / totalProtocols) * 100).toFixed(2))
            }))
            .filter(({ value }) => value > 0)

        setChartTokensData(tokensData);
        setChartProtocolsData(protocolsData)
    }, [portfolio.balance, portfolio.tokens, portfolio.protocols]);

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
                                        { otherBalances.length ? <label>You also have</label> : null }
                                        {
                                            otherBalances.map(({ network, total }, i) => (
                                                <div className="balance-container" key={network}>
                                                    <div className="other-balance" onClick={() => setNetwork(network)}>
                                                        <label>
                                                            <span className="purple-highlight">$</span> { total.truncated }
                                                            <span className="purple-highlight">.{total.decimals}</span>
                                                        </label>
                                                        on
                                                        <div className="network">
                                                            <div className="icon" style={{backgroundImage: `url(${networkDetails(network).icon})`}}></div>
                                                            <div className="name">
                                                                { networkDetails(network).name }
                                                            </div>
                                                        </div>
                                                    </div>
                                                    { otherBalances.length - 1 !== i ? <label>and</label> : null }
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
                                portfolio.areProtocolsLoading ?
                                    <Loading/>
                                    :
                                    <Chart data={chartProtocolsData} size={200}/>
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
                        portfolio.areProtocolsLoading ?
                            <Loading/>
                            :
                            tableType === tableSegments[0].value ?
                                <Protocols protocols={portfolio.protocols}/>
                                :
                                <Collectibles collectibles={portfolio.collectibles}/>
                    }
                </div>
                {
                    portfolio.areProtocolsLoading || !portfolio.protocols.length ?
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