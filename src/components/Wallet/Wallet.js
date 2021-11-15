import "./Wallet.scss"

import { Switch, Route, Redirect } from "react-router-dom"
import Dashboard from "./Dashboard/Dashboard"
import TopBar from "./TopBar/TopBar"
import SideBar from "./SideBar/SideBar"
import Deposit from "./Deposit/Deposit"
import Swap from "./Swap/Swap"
import Transfer from "./Transfer/Transfer"
import Earn from "./Earn/Earn"
import Security from "./Security/Security"
import Transactions from './Transactions/Transactions'
import PluginGnosisSafeApps from "../Plugins/GnosisSafeApps/GnosisSafeApps"
import Collectable from "./Collectable/Collectable"

export default function Wallet(props) {
  const routes = [
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
      path: '/earn',
      component: <Earn portfolio={props.portfolio} selectedNetwork={{...props.network}} selectedAcc={props.selectedAcc} addRequest={props.addRequest}/>
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
      <div id="wallet-container">
        <Switch>
          {
            routes.map(({ path, component }) => (
              <Route path={props.match.url + path} key={path}>
                { component ? component : null }
              </Route>
            ))
          }
          <Route path={props.match.url + "/"}>
            <Redirect to={props.match.url + "/dashboard"} />
          </Route>
        </Switch>
      </div>
    </div>
  );
}
