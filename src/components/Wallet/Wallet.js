import "./Wallet.scss"

import { Switch, Route, Redirect } from "react-router-dom";
import Dashboard from "./Dashboard/Dashboard";
import TopBar from "./TopBar/TopBar";
import SideBar from "./SideBar/SideBar";
import Deposit from "./Deposit/Deposit"
import Transfer from "./Transfer/Transfer"
import Collectable from "./Collectable/Collectable";

export default function Wallet(props) {
  return (
    <div id="wallet">
      <TopBar {...props} />
      <SideBar match={props.match} portfolio={props.portfolio}/>
      <div id="wallet-container">
        <Switch>
          <Route path={props.match.url + "/dashboard"}>
            <Dashboard portfolio={props.portfolio} setNetwork={props.setNetwork} />
          </Route>
          <Route path={props.match.url + "/deposit"}>
            <Deposit selectedAcc={props.selectedAcc} selectedNetwork={props.network.id} />
          </Route>
          <Route path={props.match.url + "/transfer"}>
            <Transfer portfolio={props.portfolio} selectedAcc={props.selectedAcc} accounts={props.accounts}/>
          </Route>
          <Route path={props.match.url + "/security"}></Route>
          <Route path={props.match.url + "/transactions"}></Route>
          <Route path={props.match.url + "/swap"}></Route>
          <Route path={props.match.url + "/earn"}></Route>
          <Route path={props.match.url + "/nft/:network/:collectionAddr/:tokenId"}>
            <Collectable/>
          </Route>

          <Route path={props.match.url + "/"}>
            <Redirect to={props.match.url + "/dashboard"} />
          </Route>
        </Switch>
      </div>
    </div>
  );
}
