import './Dashboard.scss'

import { useEffect, useLayoutEffect, useState } from 'react'

import { Chart, Loading, Segments } from 'components/common'
import Balances from './Balances/Balances'
import Protocols from './Protocols/Protocols'
import Collectibles from './Collectibles/Collectibles'
import { MdOutlineInfo } from 'react-icons/md'

export default function Dashboard({ portfolio, selectedNetwork, selectedAccount, setNetwork, privateMode }) {

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

    useLayoutEffect(() => {
        const tokensData = portfolio.tokens
            .map(({ label, symbol, balanceUSD }) => ({
                label: label || symbol,
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
                                <Balances
                                    portfolio={portfolio}
                                    selectedNetwork={selectedNetwork}
                                    setNetwork={setNetwork}
                                    hidePrivateValue={privateMode.hidePrivateValue}
                                />
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
                                    privateMode.hidePrivateContent(<Chart data={chartTokensData} size={200}/>)
                                :
                                portfolio.areProtocolsLoading ?
                                    <Loading/>
                                    :
                                    privateMode.hidePrivateContent(<Chart data={chartProtocolsData} size={200}/>)
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
                        tableType === tableSegments[0].value ?
                            <Protocols
                                portfolio={portfolio}
                                network={selectedNetwork}
                                account={selectedAccount}
                                hidePrivateValue={privateMode.hidePrivateValue}
                            />
                            :
                            <Collectibles portfolio={portfolio} isPrivateMode={privateMode.isPrivateMode} />
                    }
                </div>
                <div className="footer">
                    <div id="missing-token-notice">
                        <MdOutlineInfo/>
                        <span>
                            If you don't see a specific token that you own, please check the <a href={`${selectedNetwork.explorerUrl}/address/${selectedAccount}`} target="_blank" rel="noreferrer">Block Explorer</a>
                        </span>
                    </div>
                    {
                        portfolio.areProtocolsLoading || !portfolio.protocols.length ?
                            null
                            :
                            <div className="powered">
                                Powered by Velcro
                            </div>
                    }
                </div>
            </div>
        </section>
    )
}
