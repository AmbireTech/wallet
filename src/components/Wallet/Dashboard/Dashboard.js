import cn from 'classnames'
import { useLayoutEffect, useState, useMemo, useCallback } from 'react'
import { useParams } from 'react-router-dom'

import { Loading, Panel } from 'components/common'
import Balances from './Balances/Balances'
import Tokens from './Tokens/Tokens'
import Collectibles from './Collectibles/Collectibles'

import Promotions from './Promotions/Promotions'
import Tabs from 'components/common/Tabs/Tabs'
import Chart from './Chart/Chart'
import AssetsMigrationBanner from 'components/common/AssetsMigrationBanner/AssetsMigrationBanner'
import PendingRecoveryNotice from 'components/Wallet/Security/PendingRecoveryNotice/PendingRecoveryNotice'
import usePasswordRecoveryCheck from 'hooks/usePasswordRecoveryCheck'
import OutdatedBalancesMsg from './OutdatedBalancesMsg/OutdatedBalancesMsg'

import styles from './Dashboard.module.scss'

const Footer = ({ selectedAccount, selectedNetwork, isAddBtnShown, onFooterButtonClick }) => <div className={styles.footer}>
    <span className={styles.missingTokenNotice}>
        If you don't see a specific token that you own, please
        {!isAddBtnShown ? ` check the ` : " "}
        {!isAddBtnShown ? (<a href={`${selectedNetwork.explorerUrl}/address/${selectedAccount}`} target="_blank" rel="noreferrer">
            Block Explorer
        </a>) : (<button className={styles.footerButton} onClick={onFooterButtonClick}>
            add it manually
        </button>)}
    </span>
</div>

export default function Dashboard({ portfolio, selectedNetwork, selectedAccount, setNetwork, privateMode, rewardsData,  userSorting, setUserSorting, accounts, addRequest, relayerURL, useStorage, match, showSendTxns }) {
    const { tabId } = useParams()

    const balance = useMemo(() => portfolio.balance, [portfolio.balance])
    const tokens = useMemo(() => portfolio.tokens, [portfolio.tokens])
    const [chartTokensData, setChartTokensData] = useState([]);
    const defaultTab = tabId ? (tabId === 'tokens' ? 1 : 2) : 1

    const currentAccount = accounts.find(a => a.id.toLowerCase() === selectedAccount.toLowerCase())

    const { hasPendingReset, recoveryLock, isPasswordRecoveryCheckLoading } = usePasswordRecoveryCheck(relayerURL, currentAccount, selectedNetwork)
    const isBalancesCachedCurrentNetwork = portfolio.cache || false
    // Add/Hide token modal state
    const [addOrHideTokenModal, setAddOrHideTokenModal] = useState({
        isOpen: false,
        defaultSection: 'Add Token'
    })

    useLayoutEffect(() => {
        const tokensData = tokens
            .map(({ label, symbol, balanceUSD }) => ({
                label: label || symbol,
                value: Number(((balanceUSD / balance.total.full) * 100).toFixed(2)),
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
                }],
                tokensLength: tokens?.length,
                allTokensWithoutPrice: tokens?.length && tokens.every(t => !t.price)
            })
        }
    }, [balance, tokens, portfolio?.balance?.total?.full]);

    // Open Add Token modal function
    const openAddTokenModal = useCallback(() => {
        setAddOrHideTokenModal({isOpen: true, defaultSection: 'Add Token'})
    }, [])

    return (
        <section className={styles.wrapper}>
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
                    title="You also have"
                >
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
                <Tabs
                    firstTabLabel="Tokens"
                    secondTabLabel="Collectibles"
                    firstTab={
                        <Tokens
                            portfolio={portfolio}
                            network={selectedNetwork}
                            account={selectedAccount}
                            hidePrivateValue={privateMode.hidePrivateValue}
                            userSorting={userSorting}
                            setUserSorting={setUserSorting}
                            addOrHideTokenModal={addOrHideTokenModal}
                            setAddOrHideTokenModal={setAddOrHideTokenModal}
                            footer={
                                <Footer
                                    selectedAccount={selectedAccount}
                                    selectedNetwork={selectedNetwork}
                                    onFooterButtonClick={openAddTokenModal}
                                    isAddBtnShown
                                />
                            }
                        />
                    }
                    secondTab={
                        <Collectibles
                            portfolio={portfolio}
                            isPrivateMode={privateMode.isPrivateMode}
                            selectedNetwork={selectedNetwork}
                            footer={
                                <Footer
                                    selectedAccount={selectedAccount}
                                    selectedNetwork={selectedNetwork}
                                    isAddBtnShown={false}
                                />
                            }
                        />
                    }
                    panelClassName={styles.assetsPanel}
                    buttonClassName={styles.tab}
                    shadowClassName={styles.tabsShadow}
                    defaultTab={defaultTab}
                />
        </section>
    )
}
