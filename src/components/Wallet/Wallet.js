import { Switch, Route, Redirect } from 'react-router-dom'
import Dashboard from './Dashboard/Dashboard'
import TopBar from './TopBar'
import SideBar from './SideBar'

export default function Wallet(props) {
    return (
        <div id="wallet">
            <TopBar {...props}/>
            <SideBar match={props.match}/>
            <Switch>
                <Route path={props.match.url + "/dashboard"}>
                    <Dashboard selectedAcc={props.selectedAcc} selectedNetwork={props.network.id}/>
                </Route>
                <Route path={props.match.url + "/deposit"}></Route>
                <Route path={props.match.url + "/security"}></Route>
                <Route path={props.match.url + "/transfer"}></Route>
                <Route path={props.match.url + "/swap"}></Route>
                <Route path={props.match.url + "/earn"}></Route>

                <Route path={props.match.url + "/"}>
                    <Redirect to={props.match.url + "/dashboard"}/>
                </Route>
            </Switch>
        </div>
    )
}