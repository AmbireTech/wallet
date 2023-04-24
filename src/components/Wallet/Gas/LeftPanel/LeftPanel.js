import { Panel } from 'components/common'
import Heading from './Heading/Heading'
import Information from './Information/Information'

const LeftPanel = ({
  network,
  relayerURL,
  portfolio,
  account,
  gasTankState,
  setGasTankState,
  panelClassName
}) => {
  return (
    <Panel className={panelClassName} title="Gas Tank">
      <Heading
        network={network}
        relayerURL={relayerURL}
        portfolio={portfolio}
        account={account}
        gasTankState={gasTankState}
        setGasTankState={setGasTankState}
      />
      <Information />
    </Panel>
  )
}

export default LeftPanel
