import BaseAddAccount from 'components/AddAccount/AddAccount'

import styles from './AddAccount.module.scss'

const AddAccount = ({ relayerURL, onAddAccount, utmTracking, pluginData }) => (
  <BaseAddAccount
    relayerURL={relayerURL}
    onAddAccount={onAddAccount}
    utmTracking={utmTracking}
    pluginData={pluginData}
    isSDK={true}
    className={styles.wrapper}
  />
)

export default AddAccount
