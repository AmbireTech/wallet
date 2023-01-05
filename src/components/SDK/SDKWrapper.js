import { Switch, Route } from 'react-router-dom'
import EmailLoginSDK from 'components/SDK/EmailLogin'
import AddAccountSDK from 'components/SDK/AddAccount'
import OnRampSDK from 'components/SDK/OnRamp'
import SendTransactionSDK from 'components/SDK/SendTransaction'
import SignMessageSDK from 'components/SDK/SignMessage'
import LogoutSDK from 'components/SDK/Logout'
import { ReactComponent as AmbireLogoIcon } from 'resources/logo.svg'
import styles from './SDK.module.scss'

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
      path: '/on-ramp',
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
    {
      path: '/logout',
      component: <LogoutSDK/>
    },
  ]

  return (
    <Switch>
      <div className={styles.wrapper}>
        <div className={styles.headerAndBody}>
          <div className={styles.header}>
            <span className={styles.tempLogo}>Logo</span>
          </div>
          <div className={styles.body}>
            {
              routes.map(({ path, component }) => (
                  <Route exact path={props.match.url + path} key={path}>
                      { component ? component : null }
                  </Route>
              ))
            }
          </div>
        </div>
        <div className={styles.footer}>
          <p className={styles.footerText}>Powered by Ambire Wallet</p>
          <AmbireLogoIcon className={styles.footerLogo} />
        </div>
      </div>
    </Switch>
  )
}
