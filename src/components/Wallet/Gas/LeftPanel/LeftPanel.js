import Heading from './Heading/Heading'
import Information from './Information/Information'

import styles from './LeftPanel.module.scss'

const LeftPanel = ({ network, relayerURL, portfolio, account, gasTankState, setGasTankState }) => {

  return (
    <div className={styles.wrapper}>
      <Heading
        network={network}
        relayerURL={relayerURL}
        portfolio={portfolio}
        account={account}
        gasTankState={gasTankState}
        setGasTankState={setGasTankState}
      />
      <Information />
    </div>
  )
}

export default LeftPanel
