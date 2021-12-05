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
import PluginGnosisSafeApps from '../Plugins/GnosisSafeApps/GnosisSafeApps'
import Collectible from "./Collectible/Collectible"
import { PermissionsModal } from '../Modals'
import { useModals, usePermissions } from '../../hooks'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { isFirefox } from '../../lib/isFirefox'

export default function Wallet(props) {
  const { showModal } = useModals()
  const { isClipboardGranted, isNoticationsGranted, arePermissionsLoaded, modalHidden } = usePermissions()
  const { pathname } = useLocation()
  const walletContainer = useRef()

  const isLoggedIn = useMemo(() => props.accounts.length > 0, [props.accounts])

  const routes = [
    {
      path: '/dashboard',
      component: <Dashboard
        portfolio={props.portfolio}
        selectedNetwork={props.network}
        setNetwork={props.setNetwork}
      />
    },
    {
      path: '/deposit',
      component: <Deposit selectedAcc={props.selectedAcc} selectedNetwork={props.network.id} />
    },
    {
      path: '/transfer/:tokenAddress?',
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
      path: '/earn',
      component: <Earn portfolio={props.portfolio} selectedNetwork={{ ...props.network }} selectedAcc={props.selectedAcc} addRequest={props.addRequest} />
    },
    {
      path: '/security',
      component: <Security
        relayerURL={props.relayerURL}
        selectedAcc={props.selectedAcc}
        selectedNetwork={props.network}
        accounts={props.accounts}
        addressBook={props.addressBook}
        addRequest={props.addRequest}
        onAddAccount={props.onAddAccount}
      />
    },
    {
      path: '/transactions',
      component: <Transactions relayerURL={props.relayerURL} selectedAcc={props.selectedAcc} selectedNetwork={props.network} addRequest={props.addRequest} eligibleRequests={props.eligibleRequests} showSendTxns={props.showSendTxns} />
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

  const handlePermissionsModal = useCallback(async () => {
    const account = props.accounts.find(({ id }) => id === props.selectedAcc)
    if (!account) return

    const relayerIdentityURL = `${props.relayerURL}/identity/${account.id}`

    const permissionsModal = <PermissionsModal relayerIdentityURL={relayerIdentityURL} account={account} onAddAccount={props.onAddAccount}/>
    const areBlockedPermissions = arePermissionsLoaded
      && ((!isFirefox() && !isClipboardGranted) || !isNoticationsGranted)
    const showCauseOfPermissions = areBlockedPermissions && !modalHidden
    const showCauseOfEmail = !!account.emailConfRequired
    if (showCauseOfEmail || showCauseOfPermissions) showModal(permissionsModal, { disableClose: true })
  }, [props.relayerURL, props.accounts, props.selectedAcc, props.onAddAccount, showModal, isClipboardGranted, isNoticationsGranted, arePermissionsLoaded, modalHidden])

  useEffect(() => handlePermissionsModal(), [handlePermissionsModal])

  useEffect(() => {
    setTimeout(() => walletContainer.current.scrollTo({ top: 0, behavior: 'smooth' }), 0)
  }, [pathname])

  return (
    <div id="wallet">
      <SideBar match={props.match} portfolio={props.portfolio} />
      <TopBar {...props} />

      <div id="wallet-container" ref={walletContainer}>
        <Switch>
          {
            routes.map(({ path, component }) => (
              <Route exact path={props.match.url + path} key={path}>
                {
                  !isLoggedIn ?
                    <Redirect to="/add-account" />
                    :
                    component ? component : null
                }
              </Route>
            ))
          }
          <Route path={props.match.url + '/*'}>
            <Redirect to={props.match.url + '/dashboard'} />
          </Route>
        </Switch>
      </div>
    </div>
  );
}
