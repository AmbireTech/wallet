import "./Wallet.scss"

import { Suspense, useCallback, useEffect, useMemo, useRef } from 'react'
import { Switch, Route, Redirect, useLocation, useRouteMatch } from "react-router-dom"
import PluginGnosisSafeApps from 'components/Plugins/GnosisSafeApps/GnosisSafeApps'
import { useModals, usePermissions, useLocalStorage } from 'hooks'
import { isFirefox } from 'lib/isFirefox'
import unsupportedDApps from 'ambire-common/src/constants/unsupportedDApps'
// Components
import TopBar from "./TopBar/TopBar"
import PermissionsModal from "components/Modals/PermissionsModal/PermissionsModal"
import UnsupportedDAppsModal from "components/Modals/UnsupportedDAppsModal/UnsupportedDAppsModal"
import SideBar from "./SideBar/SideBar"
import { Loading } from "components/common"
import DappsCatalog from "./DappsCatalog/DappsCatalog"
// Pages
import Transfer from "./Transfer/Transfer"
import Dashboard from "./Dashboard/Dashboard"
import Swap from "./Swap/Swap"
import Earn from "./Earn/Earn"
import Security from "./Security/Security"
import Transactions from './Transactions/Transactions'
import Collectible from "./Collectible/Collectible"
import CrossChain from "./CrossChain/CrossChain"
import OpenSea from "./OpenSea/OpenSea"
import Deposit from "./Deposit/Deposit"
import Gas from "./Gas/Gas"

export default function Wallet(props) {
  const { showModal } = useModals()
  const { isClipboardGranted, isNoticationsGranted, arePermissionsLoaded, modalHidden } = usePermissions()
  const { pathname } = useLocation()
  const walletContainerInner = useRef()
  const { isDappMode } = props.dappsCatalog
  const routeMatch = useRouteMatch('/wallet/dapps')

  const dapModeSidebar = useMemo(() => isDappMode && routeMatch, [isDappMode, routeMatch])

  const isLoggedIn = useMemo(() => props.accounts.length > 0, [props.accounts])
  const [advancedModeList, setAdvancedModeList] = useLocalStorage({ key: 'dAppsAdvancedMode', defaultValue: [] })

  const routes = [
    {
      path: '/dashboard/:tabId?/:page?',
      component: <Dashboard
        portfolio={props.portfolio}
        selectedNetwork={props.network}
        selectedAccount={props.selectedAcc}
        accounts={props.accounts}
        setNetwork={props.setNetwork}
        privateMode={props.privateMode}
        rewardsData={props.rewardsData}
        addRequest={props.addRequest}
        relayerURL={props.relayerURL}
        useStorage={props.useStorage}
        userSorting={props.userSorting}
        setUserSorting={props.setUserSorting}
        match={props.match}
        showSendTxns={props.showSendTxns}
      />
    },
    {
      path: '/deposit',
      component: <Deposit
        selectedAcc={props.selectedAcc}
        selectedNetwork={props.network}
        accounts={props.accounts}
        addRequest={props.addRequest}
        relayerURL={props.relayerURL}
        portfolio={props.portfolio}
        useStorage={props.useStorage}
      />
    },
    {
      path: '/transfer/:tokenAddressOrSymbol?',
      component: <Transfer
        portfolio={props.portfolio}
        selectedAcc={props.selectedAcc}
        selectedNetwork={{...props.network}}
        addRequest={props.addRequest}
        accounts={props.accounts}
        addressBook={props.addressBook}
        relayerURL={props.relayerURL}
      />
    },
    {
      path: '/cross-chain',
      component: <CrossChain
        addRequest={props.addRequest}
        selectedAccount={props.selectedAcc}
        portfolio={props.portfolio}
        network={props.network}
        relayerURL={props.relayerURL}
      />
    },
    {
      path: '/earn',
      component: <Earn
        portfolio={props.portfolio}
        selectedNetwork={{ ...props.network }}
        selectedAcc={props.selectedAcc}
        rewardsData={props.rewardsData}
        addRequest={props.addRequest}
      />
    },
    {
      path: '/security',
      component: <Security
        relayerURL={props.relayerURL}
        selectedAcc={props.selectedAcc}
        selectedNetwork={props.network}
        accounts={props.accounts}
        addRequest={props.addRequest}
        showSendTxns={props.showSendTxns}
        onAddAccount={props.onAddAccount}
      />
    },
    {
      path: '/transactions/:page?/(messages)?/:page?',
      component: <Transactions
        relayerURL={props.relayerURL}
        selectedAcc={props.selectedAcc}
        selectedNetwork={props.network}
        addRequest={props.addRequest}
        eligibleRequests={props.eligibleRequests}
        showSendTxns={props.showSendTxns}
        setSendTxnState={props.setSendTxnState}
        privateMode={props.privateMode}
      />
    },
    {
      path: '/swap',
      component: <Swap
        gnosisConnect={props.gnosisConnect}
        gnosisDisconnect={props.gnosisDisconnect}
        selectedAcc={props.selectedAcc}
        network={props.network}
      />
    },
    {
      path: '/dapps',
      component: <DappsCatalog
        network={props.network}
        dappsCatalog={props.dappsCatalog}
        gnosisConnect={props.gnosisConnect}
        gnosisDisconnect={props.gnosisDisconnect}
        selectedAcc={props.selectedAcc}
      />
    },
    {
      path: '/opensea',
      component: <OpenSea
        gnosisConnect={props.gnosisConnect}
        gnosisDisconnect={props.gnosisDisconnect}
        selectedAcc={props.selectedAcc}
        network={props.network}
      />
    },
    {
      path: '/nft/:network/:collectionAddr/:tokenId',
      component: <Collectible
        selectedAcc={props.selectedAcc}
        selectedNetwork={{...props.network}}
        addRequest={props.addRequest}
        accounts={props.accounts}
        addressBook={props.addressBook}
      />
    },
    {
      path: '/gnosis/plugins/:plugin?',
      component: <PluginGnosisSafeApps
        gnosisConnect={props.gnosisConnect}
        gnosisDisconnect={props.gnosisDisconnect}
        selectedAcc={props.selectedAcc}
        network={props.network}
      />
    },
    {
      path: '/gas-tank',
      component: <Gas
        selectedNetwork={{...props.network}}
        relayerURL={props.relayerURL}
        portfolio={props.portfolio}
        selectedAccount={props.selectedAcc}
        setGasTankState={props.setGasTankState}
        gasTankState={props.gasTankState}
      />
    }
  ]

  const LoggedInGuard = () => (
    !isLoggedIn ? <Redirect to="/add-account"/> : null
  )

  const handlePermissionsModal = useCallback(async () => {
    const account = props.accounts.find(({ id }) => id === props.selectedAcc)
    if (!account) return

    const relayerIdentityURL = `${props.relayerURL}/identity/${account.id}`

    const areBlockedPermissions = arePermissionsLoaded
      && ((!isFirefox() && !isClipboardGranted) || !isNoticationsGranted)
    const showCauseOfPermissions = areBlockedPermissions && !modalHidden
    const showCauseOfEmail = !!account.emailConfRequired
    const showCauseOfBackupOptout = account.backupOptout

    const permissionsModal = <PermissionsModal
      relayerIdentityURL={relayerIdentityURL}
      account={account}
      onAddAccount={props.onAddAccount}
      isCloseBtnShown={!showCauseOfBackupOptout}
      isBackupOptout={!showCauseOfBackupOptout}
      showThankYouPage={props.showThankYouPage}
    />
    
    const isMobile = navigator.platform.includes('Android') || navigator.platform.includes('iOS')
    if ((showCauseOfEmail || showCauseOfPermissions || showCauseOfBackupOptout) && !isMobile) showModal(permissionsModal, { disableClose: true })
  }, [props.accounts, props.relayerURL, props.onAddAccount, props.showThankYouPage, props.selectedAcc, arePermissionsLoaded, isClipboardGranted, isNoticationsGranted, modalHidden, showModal])

  useEffect(() => handlePermissionsModal(), [handlePermissionsModal])

  // On pathname change (i.e. navigating to different page), always scroll to top
  useEffect(() => {
    // Removes scroll top when we navigate from Tokens to Collectibles and vice-versa
    if (pathname === '/wallet/dashboard/collectibles' || pathname === '/wallet/dashboard') return

    const scrollTimeout = setTimeout(() => walletContainerInner.current && walletContainerInner.current.scrollTo({ top: 0, behavior: 'smooth' }), 0)
    return () => clearTimeout(scrollTimeout)
  }, [pathname])

  useEffect(() => {
    const unsupported = props.connections
      .filter(({ session }) => session && session.peerMeta && unsupportedDApps.includes(session.peerMeta.url) && !advancedModeList.includes(session.peerMeta.url))

    if (unsupported.length) showModal(<UnsupportedDAppsModal connections={unsupported} disconnect={props.disconnect} advancedModeList={advancedModeList} onContinue={setAdvancedModeList} />)
  }, [props.connections, props.disconnect, showModal, advancedModeList, setAdvancedModeList])

  return (
    <div id="wallet">
      <SideBar match={props.match} portfolio={props.portfolio} hidePrivateValue={props.privateMode.hidePrivateValue} relayerURL={props.relayerURL} selectedNetwork={props.network} dappsCatalog={props.dappsCatalog} />

      <div id="wallet-container" className={dapModeSidebar ? 'dapp-mode' : ''}>
        <TopBar {...props} />
        <div id="wallet-container-inner" ref={walletContainerInner}>
          <Suspense fallback={<Loading />}>
            <Switch>
              {
                routes.map(({ path, component }) => (
                  <Route exact path={props.match.url + path} key={path}>
                    <LoggedInGuard/>
                      { component ? component : null }
                  </Route>
                ))
              }
              <Route path={props.match.url + '/*'}>
                <Redirect to={props.match.url + '/dashboard'} />
              </Route>
              <Route path={props.match.url}>
                <LoggedInGuard/>
              </Route>
            </Switch>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
