import { Alert } from 'components/common'
import LeftPanel from './LeftPanel/LeftPanel'
import RightPanel from './RightPanel/RightPanel'

import styles from './Gas.module.scss'

const Gas = ({
  selectedNetwork,
  relayerURL,
  portfolio,
  selectedAccount,
  gasTankState,
  setGasTankState
}) =>
  selectedNetwork.isGasTankAvailable ? (
    <section className={styles.wrapper}>
      <LeftPanel
        network={selectedNetwork}
        relayerURL={relayerURL}
        portfolio={portfolio}
        account={selectedAccount}
        gasTankState={gasTankState}
        setGasTankState={setGasTankState}
        panelClassName={styles.panel}
      />
      <RightPanel
        network={selectedNetwork}
        relayerURL={relayerURL}
        portfolio={portfolio}
        account={selectedAccount}
        gasTankState={gasTankState}
        setGasTankState={setGasTankState}
        panelClassName={styles.panel}
      />
    </section>
  ) : (
    <div className={styles.unavailable}>
      <Alert
        type="danger"
        title={`Gas Tank is not available on ${
          selectedNetwork.id.charAt(0).toUpperCase() + selectedNetwork.id.slice(1)
        }`} // Capitalize the network id
      />
    </div>
  )

export default Gas
