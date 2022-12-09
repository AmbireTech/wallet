import { Switch, Route } from 'react-router-dom'
import EmailLoginSDK from 'components/SDK/EmailLogin'
import AddAccountSDK from 'components/SDK/AddAccount'
import OnRampSDK from 'components/SDK/OnRamp'
import SendTransactionSDK from 'components/SDK/SendTransaction'
import SignMessageSDK from 'components/SDK/SignMessage'

export default function SDKWrapper(props) {

  const routes = [
    {
      path: '/email-login',
      component: <EmailLoginSDK
        relayerURL={props.relayerURL}
        onAddAccount={props.onAddAccount}
      />
    },
    {
      path: '/add-account',
      component: <AddAccountSDK
        relayerURL={props.relayerURL}
        onAddAccount={props.onAddAccount}
        utmTracking={props.utmTracking}
        pluginData={props.pluginData}
      />
    },
    {
      path: '/on-ramp/:chainID',
      component: <OnRampSDK
        relayerURL={props.relayerURL}
      />
    },
    {
      path: '/send-transaction/:txnTo/:txnValue/:txnData',
      component: <SendTransactionSDK
        selectedAcc={props.selectedAcc}
        selectedNetwork={props.selectedNetwork}
        addRequest={props.addRequest}
        sendTxnState={props.sendTxnState}
        internalRequests={props.internalRequests}
      />
    },
    {
      path: '/sign-message/:type/:messageToSign',
      component: <SignMessageSDK
        selectedAcc={props.selectedAcc}
        selectedNetwork={props.selectedNetwork}
        addRequest={props.addRequest}
        everythingToSign={props.everythingToSign}
      />
    },
  ]

  return (
    <Switch>
        {
          routes.map(({ path, component }) => (
              <Route exact path={props.match.url + path} key={path}>
                  { component ? component : null }
              </Route>
          ))
        }
    </Switch>
  )
}
