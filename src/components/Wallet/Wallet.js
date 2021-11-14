import "./Wallet.scss"

import { Route, Redirect } from "react-router-dom"
import { TransitionGroup, CSSTransition } from "react-transition-group"
import Dashboard from "./Dashboard/Dashboard"
import TopBar from "./TopBar/TopBar"
import SideBar from "./SideBar/SideBar"
import Deposit from "./Deposit/Deposit"
import Transfer from "./Transfer/Transfer"
import Security from "./Security/Security"
import Transactions from './Transactions/Transactions'
import PluginGnosisSafeApps from "../Plugins/GnosisSafeApps/GnosisSafeApps"
import Collectable from "./Collectable/Collectable"
import { createRef } from "react"

export default function Wallet(props) {
  const routes = [
    {
      path: '/',
      component: <Redirect to={props.match.url + '/dashboard'} />
    },
    {
      path: '/dashboard',
      component: <Dashboard portfolio={props.portfolio} setNetwork={props.setNetwork} />
    },
    {
      path: '/deposit',
      component: <Deposit selectedAcc={props.selectedAcc} selectedNetwork={props.network.id} />
    },
    {
      path: '/transfer/:tokenAddress?',
      component: <Transfer portfolio={props.portfolio} selectedAcc={props.selectedAcc} selectedNetwork={{...props.network}} accounts={props.accounts} addRequest={props.addRequest}/>
    },
    {
      path: '/security',
      component: <Security relayerURL={props.relayerURL} selectedAcc={props.selectedAcc} selectedNetwork={props.network} accounts={props.accounts} addRequest={props.addRequest}/>
    },
    {
      path: '/transactions',
      component: <Transactions relayerURL={props.relayerURL} selectedAcc={props.selectedAcc} selectedNetwork={props.network} addRequest={props.addRequest} eligibleRequests={props.eligibleRequests} showSendTxns={props.showSendTxns}/>
    },
    {
      path: '/swap'
    },
    {
      path: '/earn'
    },
    {
      path: '/nft/:network/:collectionAddr/:tokenId',
      component: <Collectable selectedAcc={props.selectedAcc} selectedNetwork={{...props.network}} addRequest={props.addRequest}/>
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

  return (
    <div id="wallet">
      <TopBar {...props} />
      <SideBar match={props.match} portfolio={props.portfolio}/>
      <TransitionGroup>
        {
          routes.map(({ path, component }) => (
            <Route key={path} exact path={props.match.url + path}>
              {({ match }) => {
                const viewRef = createRef()
                return (
                  <CSSTransition
                    in={match != null}
                    timeout={300}
                    classNames="fade"
                    unmountOnExit
                    nodeRef={viewRef}
                  >
                    <div className="view-container" ref={viewRef}>
                      { component ? component : null }
                    </div>
                  </CSSTransition>
                )
              }}
            </Route>
          ))
        }
        </TransitionGroup>
    </div>
  );
}
