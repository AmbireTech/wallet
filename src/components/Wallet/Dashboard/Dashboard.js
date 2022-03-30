import './Dashboard.scss'

import { useEffect, useLayoutEffect, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'

import { Chart, Loading, Segments } from 'components/common'
import Balances from './Balances/Balances'
import Protocols from './Protocols/Protocols'
import Collectibles from './Collectibles/Collectibles'
import { MdOutlineInfo } from 'react-icons/md'
import { FaGasPump } from 'react-icons/fa'
import Promotions from './Promotions/Promotions'
import { fetchGet } from 'lib/fetch'
import networks from 'consts/networks'
import { useModals } from 'hooks'
import GasDetailsModal from 'components/Modals/GasDetailsModal/GasDetailsModal'


const chartSegments = [
    {
        value: 'Tokens'
    },
    {
        value: 'Protocols'
    }
]

const tabSegments = [
    {
        value: 'tokens'
    },
    {
        value: 'collectibles'
    }
]

export default function Dashboard({ portfolio, selectedNetwork, selectedAccount, setNetwork, privateMode, rewardsData, relayerURL }) {
    const history = useHistory()
    const { tabId } = useParams()
    const { showModal } = useModals()

    const [chartTokensData, setChartTokensData] = useState([]);
    const [chartProtocolsData, setChartProtocolsData] = useState([]);
    const [chartType, setChartType] = useState([]);
    const [tab, setTab] = useState(tabId || tabSegments[0].value);
    const [gasData, setGasData] = useState(null)

    useEffect(() => {
        if (!tab || tab === tabSegments[0].value) return history.replace(`/wallet/dashboard`)
        history.replace(`/wallet/dashboard/${tab}`)
    }, [tab, history])

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

    useEffect(() => {
        const url = `${relayerURL}/gasPrice/${selectedNetwork.id}`

        fetchGet(url).then(gasData => {
            setGasData(gasData.data)
        }).catch(err => {
            console.log('fetch error', err)
        })
    }, [relayerURL, selectedNetwork])

    return (
        <section id="dashboard">
            <Promotions rewardsData={rewardsData} />
            <div id="overview">
                <div id="balance" className="panel">
                    {
                        gasData &&
                        <div className={'gas-info'}>
                            <span className={'native-price'}>
                                {networks.find(n => n.id === selectedNetwork.id)?.nativeAssetSymbol}: {(Number(gasData.gasFeeAssets.native)).toLocaleString('en-US', {
                                minimumFractionDigits: 2
                             })}
                            </span>
                            <span className={'gas-price'}
                                  onClick={() => {
                                    showModal(<GasDetailsModal gasData={gasData} />)
                                    }
                                  }>
                                <FaGasPump /> {Math.round(gasData.gasPrice['medium'] / 10 ** 9)} Gwei
                            </span>
                        </div>
                    }
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
                    <Segments small defaultValue={tab} segments={tabSegments} onChange={setTab}></Segments>
                </div>
                <div className="content">
                    {
                        tab === tabSegments[0].value ?
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
                </div>
            </div>
        </section>
    )
}
