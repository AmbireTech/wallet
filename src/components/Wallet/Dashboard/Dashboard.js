
import { useEffect, useLayoutEffect, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'

import { Chart, Loading, Segments, Panel } from 'components/common'
import Balances from './Balances/Balances'
import Protocols from './Protocols/Protocols'
import Collectibles from './Collectibles/Collectibles'

import Promotions from './Promotions/Promotions'
import AssetsMigrationBanner from 'components/Wallet/AssetsMigration/AssetsMigrationBanner'
import PendingRecoveryNotice from 'components/Wallet/Security/PendingRecoveryNotice/PendingRecoveryNotice'
import usePasswordRecoveryCheck from 'hooks/usePasswordRecoveryCheck'
import OutdatedBalancesMsg from './OutdatedBalancesMsg/OutdatedBalancesMsg'
import cn from 'classnames'

import styles from './Dashboard.module.scss'

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

    const [chartTokensData, setChartTokensData] = useState([]);
    const [tab, setTab] = useState(tabId || tabSegments[0].value);

    const currentAccount = accounts.find(a => a.id.toLowerCase() === selectedAccount.toLowerCase())

    const { hasPendingReset, recoveryLock, isPasswordRecoveryCheckLoading } = usePasswordRecoveryCheck(relayerURL, currentAccount, selectedNetwork)
    const isBalancesCachedCurrentNetwork = portfolio.cachedBalancesByNetworks.length ? 
        portfolio.cachedBalancesByNetworks.find(({network}) => network === selectedNetwork.id) : false

    useEffect(() => {
        if (!tab || tab === tabSegments[0].value) return history.replace(`/wallet/dashboard`)
        history.replace(`/wallet/dashboard/${tab}${tab === tabSegments[1].value ? `/${page}` : ''}`)
    }, [tab, history, page])

    useLayoutEffect(() => {
        const tokensData = portfolio.tokens
            .map(({ label, symbol, balanceUSD }) => ({
                label: label || symbol,
                value: Number(((balanceUSD / portfolio.balance.total.full) * 100).toFixed(2)),
                balanceUSD
            }))
            .filter(({ value }) => value > 0);

        if (portfolio?.balance?.total?.full && tokensData) {
                setChartTokensData({
                    empty: false,
                    data: tokensData?.sort((a, b) => b.value - a.value)
                })
        } else {
            setChartTokensData({
                empty: true,
                data: [{
                    label: "You don't have any tokens",
                    balanceUSD: 1,
                    value: 0
                }]
            })
        }
    }, [portfolio.balance, portfolio.tokens]);

    useEffect(() => portfolio.requestOtherProtocolsRefresh(), [portfolio])

    return (
        <section className={styles.wrapper}>
            { isBalancesCachedCurrentNetwork || true && (
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
            <div className={styles.overview}>
                <Panel 
                    className={cn(styles.chart, styles.panel, styles.topPanels)}
                >
                    {
                        portfolio.isCurrNetworkBalanceLoading ?
                        <Loading/> :
                        privateMode.hidePrivateContent(
                            <Chart 
                                selectedNetwork={selectedNetwork} 
                                data={chartTokensData} 
                                size={200} 
                                className={styles.chart} 
                                hidePrivateValue={privateMode.hidePrivateValue}
                                portfolio={portfolio}
                            />
                        )
                    }
                </Panel>
                <Panel 
                    className={cn(styles.balance, styles.panel, styles.topPanels)} 
                    titleClassName={styles.panelTitle} 
                    title="You also have">
                    <Balances
                        portfolio={portfolio}
                        selectedNetwork={selectedNetwork}
                        setNetwork={setNetwork}
                        hidePrivateValue={privateMode.hidePrivateValue}
                        relayerURL={relayerURL}
                        selectedAccount={selectedAccount}
                        match={match}
                    />
                </Panel>
            </div>
            <Panel title={<>Assets <Segments small defaultValue={tab} segments={tabSegments} onChange={setTab} /></>}>
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
                        <Collectibles portfolio={portfolio} isPrivateMode={privateMode.isPrivateMode} />
                }
                <div className={styles.footer}>
                    <span className={styles.missingTokenNotice}>
                        If you don't see a specific token that you own, please check the <a href={`${selectedNetwork.explorerUrl}/address/${selectedAccount}`} target="_blank" rel="noreferrer">Block Explorer</a>
                    </span>
                </div>
            </Panel>
        </section>
    )
}
