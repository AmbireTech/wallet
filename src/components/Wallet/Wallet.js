import "./Wallet.scss"

import { Switch, Route, Redirect } from "react-router-dom";
import Dashboard from "./Dashboard/Dashboard";
import TopBar from "./TopBar";
import SideBar from "./SideBar";
import Deposit from "./Deposit/Deposit"
import { usePortfolio } from '../../hooks'

export default function Wallet(props) {
  const portfolio = usePortfolio({
    currentNetwork: props.network.id,
    account: props.selectedAcc
  })

  return (
    <div id="wallet">
      <TopBar {...props} />
      <SideBar match={props.match} portfolio={portfolio}/>
      <div id="wallet-container">
        <Switch>
          <Route path={props.match.url + "/dashboard"}>
            <Dashboard portfolio={portfolio} />
          </Route>
          <Route path={props.match.url + "/deposit"}>
            <Deposit selectedAcc={props.selectedAcc} selectedNetwork={props.network.id} />
          </Route>
          <Route path={props.match.url + "/transfer"}></Route>
          <Route path={props.match.url + "/security"}></Route>
          <Route path={props.match.url + "/transactions"}></Route>
          <Route path={props.match.url + "/swap"}></Route>
          <Route path={props.match.url + "/earn"}></Route>

          <Route path={props.match.url + "/"}>
            <Redirect to={props.match.url + "/dashboard"} />
          </Route>
        </Switch>
      </div>
    </div>
  );
}
