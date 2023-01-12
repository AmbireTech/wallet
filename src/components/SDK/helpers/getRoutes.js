// Routes
import EmailLoginSDK from 'components/SDK/EmailLogin/EmailLogin'
import AddAccountSDK from 'components/SDK/AddAccount/AddAccount'
import OnRampSDK from 'components/SDK/OnRamp/OnRamp'
import SendTransactionSDK from 'components/SDK/SendTransaction/SendTransaction'
import SignMessageSDK from 'components/SDK/SignMessage/SignMessage'
import LogoutSDK from 'components/SDK/Logout/Logout'

const getRoutes = (props) => [
  {
    path: '/email-login',
    component: <EmailLoginSDK relayerURL={props.relayerURL} onAddAccount={props.onAddAccount} />,
  },
  {
    path: '/add-account',
    component: (
      <AddAccountSDK
        relayerURL={props.relayerURL}
        onAddAccount={props.onAddAccount}
        utmTracking={props.utmTracking}
        pluginData={props.pluginData}
      />
    ),
  },
  {
    path: '/on-ramp',
    component: <OnRampSDK relayerURL={props.relayerURL} />,
  },
  {
    path: '/send-transaction/:txnTo/:txnValue/:txnData',
    component: (
      <SendTransactionSDK
        selectedAcc={props.selectedAcc}
        selectedNetwork={props.selectedNetwork}
        addRequest={props.addRequest}
        sendTxnState={props.sendTxnState}
        internalRequests={props.internalRequests}
      />
    ),
  },
  {
    path: '/sign-message/:type/:messageToSign',
    component: (
      <SignMessageSDK
        selectedAcc={props.selectedAcc}
        selectedNetwork={props.selectedNetwork}
        addRequest={props.addRequest}
        everythingToSign={props.everythingToSign}
      />
    ),
  },
  {
    path: '/logout',
    component: <LogoutSDK />,
  },
]

export default getRoutes