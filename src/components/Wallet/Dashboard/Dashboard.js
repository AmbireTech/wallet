import './Dashboard.scss'

import { useEffect, useLayoutEffect, useState, useMemo } from 'react'
import { useHistory, useParams } from 'react-router-dom'

import { Chart, Loading, Segments } from 'components/common'
import Balances from './Balances/Balances'
import Protocols from './Protocols/Protocols'
import Collectibles from './Collectibles/Collectibles'
import { MdOutlineInfo } from 'react-icons/md'

import Promotions from './Promotions/Promotions'
import AssetsMigrationBanner from 'components/Wallet/AssetsMigration/AssetsMigrationBanner'
import PendingRecoveryNotice from 'components/Wallet/Security/PendingRecoveryNotice/PendingRecoveryNotice'
import usePasswordRecoveryCheck from 'hooks/usePasswordRecoveryCheck'
import OutdatedBalancesMsg from './OutdatedBalancesMsg/OutdatedBalancesMsg'

const tabSegments = [
    {
        value: 'tokens'
    },
    {
        value: 'collectibles'
    }
]


export default function Dashboard({ portfolio, selectedNetwork, selectedAccount, setNetwork, privateMode, rewardsData,  userSorting, setUserSorting, accounts, addRequest, relayerURL, useStorage, match, showSendTxns }) {
    const history = useHistory()
    const { tabId, page = 1 } = useParams()
    const balance = useMemo(() => portfolio.balance, [portfolio.balance])
    const tokens = useMemo(() => portfolio.tokens, [portfolio.tokens])
    const [chartTokensData, setChartTokensData] = useState([]);
    const [tab, setTab] = useState(tabId || tabSegments[0].value);

    const currentAccount = accounts.find(a => a.id.toLowerCase() === selectedAccount.toLowerCase())

    const { hasPendingReset, recoveryLock, isPasswordRecoveryCheckLoading } = usePasswordRecoveryCheck(relayerURL, currentAccount, selectedNetwork)
    const isBalancesCachedCurrentNetwork = portfolio.cache || false

    useEffect(() => {
        if (!tab || tab === tabSegments[0].value) return history.replace(`/wallet/dashboard`)
        history.replace(`/wallet/dashboard/${tab}${tab === tabSegments[1].value ? `/${page}` : ''}`)
    }, [tab, history, page])

    useLayoutEffect(() => {
        const tokensData = tokens
            .map(({ label, symbol, balanceUSD }) => ({
                label: label || symbol,
                value: Number(((balanceUSD / balance.total.full) * 100).toFixed(2))
            }))
            .filter(({ value }) => value > 0);
        setChartTokensData(tokensData);
    }, [balance, tokens]);


    return (
        <section id="dashboard">
            { isBalancesCachedCurrentNetwork && (
                <OutdatedBalancesMsg 
                    selectedNetwork={selectedNetwork}
                    selectedAccount={selectedAccount} 
                />)
            }
            <Promotions rewardsData={rewardsData} />
            {
              <AssetsMigrationBanner
                selectedNetwork={selectedNetwork}
                selectedAccount={selectedAccount}
                accounts={accounts}
                addRequest={addRequest}
                closeable={true}
                relayerURL={relayerURL}
                portfolio={portfolio}
                useStorage={useStorage}
              />
            }
            {
              (hasPendingReset && !isPasswordRecoveryCheckLoading) && (
                <PendingRecoveryNotice
                  recoveryLock={recoveryLock}
                  showSendTxns={showSendTxns}
                  selectedAccount={currentAccount}
                  selectedNetwork={selectedNetwork}
                />
              )
            }
            <div id="overview">
                <div id="balance" className="panel">
                    <div className="title">Balance</div>
                    <div className="content">
                        <Balances
                            portfolio={portfolio}
                            selectedNetwork={selectedNetwork}
                            setNetwork={setNetwork}
                            hidePrivateValue={privateMode.hidePrivateValue}
                            relayerURL={relayerURL}
                            selectedAccount={selectedAccount}
                            match={match}
                        />
                    </div>
                </div>
                <div id="chart" className="panel">
                    <div className="title">
                        Balance by tokens
                    </div>
                    <div className="content">
                        {
                            
                            portfolio.isCurrNetworkBalanceLoading ?
                                <Loading/>
                                :
                                privateMode.hidePrivateContent(<Chart data={chartTokensData} size={200}/>)
                                
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
                                userSorting={userSorting}
                                setUserSorting={setUserSorting}
                            />
                            :
                            <Collectibles
                                portfolio={portfolio}
                                isPrivateMode={privateMode.isPrivateMode}
                                selectedNetwork={selectedNetwork}
                            />
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
