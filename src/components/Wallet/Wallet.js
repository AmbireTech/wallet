import "./Wallet.scss"

import { Switch, Route, Redirect, useLocation  } from "react-router-dom"
import Dashboard from "./Dashboard/Dashboard"
import TopBar from "./TopBar/TopBar"
import SideBar from "./SideBar/SideBar"
import Deposit from "./Deposit/Deposit"
import Swap from "./Swap/Swap"
import Transfer from "./Transfer/Transfer"
import Earn from "./Earn/Earn"
import Security from "./Security/Security"
import Transactions from './Transactions/Transactions'
import PluginGnosisSafeApps from 'components/Plugins/GnosisSafeApps/GnosisSafeApps'
import Collectible from "./Collectible/Collectible"
import { PermissionsModal, UnsupportedDAppsModal } from 'components/Modals'
import { useModals, usePermissions, useLocalStorage } from 'hooks'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { isFirefox } from 'lib/isFirefox'
import CrossChain from "./CrossChain/CrossChain"
import OpenSea from "./OpenSea/OpenSea"
import unsupportedDApps from 'consts/unsupportedDApps'

export default function Wallet(props) {
  const { showModal } = useModals()
  const { isClipboardGranted, isNoticationsGranted, arePermissionsLoaded, modalHidden } = usePermissions()
  const { pathname } = useLocation()
  const walletContainer = useRef()

  const isLoggedIn = useMemo(() => props.accounts.length > 0, [props.accounts])
  const [advancedModeList, setAdvancedModeList] = useLocalStorage({ key: 'dAppsAdvancedMode', defaultValue: [] })

  const routes = [
    {
      path: '/dashboard/:tabId?',
      component: <Dashboard
        portfolio={props.portfolio}
        selectedNetwork={props.network}
        selectedAccount={props.selectedAcc}
        accounts={props.accounts}
        setNetwork={props.setNetwork}
        privateMode={props.privateMode}
        rewardsData={props.rewardsData}
        addRequest={props.addRequest}
      />
    },
    {
      path: '/deposit',
      component: <Deposit
        selectedAcc={props.selectedAcc}
        selectedNetwork={props.network}
        accounts={props.accounts}
        addRequest={props.addRequest}
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
      path: '/transactions/:page?',
      component: <Transactions
        relayerURL={props.relayerURL}
        selectedAcc={props.selectedAcc}
        selectedNetwork={props.network}
        addRequest={props.addRequest}
        eligibleRequests={props.eligibleRequests}
        showSendTxns={props.showSendTxns}
        setSendTxnState={props.setSendTxnState}
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
      path: '/gnosis/plugins',
      component: <PluginGnosisSafeApps
        gnosisConnect={props.gnosisConnect}
        gnosisDisconnect={props.gnosisDisconnect}
        selectedAcc={props.selectedAcc}
        network={props.network}
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
    />

    if (showCauseOfEmail || showCauseOfPermissions || showCauseOfBackupOptout) showModal(permissionsModal, { disableClose: true })
  }, [props.accounts, props.relayerURL, props.onAddAccount, props.selectedAcc, arePermissionsLoaded, isClipboardGranted, isNoticationsGranted, modalHidden, showModal])

  useEffect(() => handlePermissionsModal(), [handlePermissionsModal])

  useEffect(() => {
    const scrollTimeout = setTimeout(() => walletContainer.current && walletContainer.current.scrollTo({ top: 0, behavior: 'smooth' }), 0)
    return () => clearTimeout(scrollTimeout)
  }, [pathname])

  useEffect(() => {
    const unsupported = props.connections
      .filter(({ session }) => session && session.peerMeta && unsupportedDApps.includes(session.peerMeta.url) && !advancedModeList.includes(session.peerMeta.url))

    if (unsupported.length) showModal(<UnsupportedDAppsModal connections={unsupported} disconnect={props.disconnect} advancedModeList={advancedModeList} onContinue={setAdvancedModeList} />)
  }, [props.connections, props.disconnect, showModal, advancedModeList, setAdvancedModeList])

  return (
    <div id="wallet">
      <SideBar match={props.match} portfolio={props.portfolio} hidePrivateValue={props.privateMode.hidePrivateValue} />
      <TopBar {...props} />

      <div id="wallet-container" ref={walletContainer}>
        <div id="wallet-container-inner">
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
        </div>
      </div>
    </div>
  );
}
