import './OpenSea.scss'
import { OPENSEA_FRAME_URL } from 'config'
import GnosisSafeAppIframe from 'components/Plugins/GnosisSafeApps/GnosisSafeAppIframe'

const ambireOpenSea = {
  name: 'Ambire OpenSea Plugin',
  url: OPENSEA_FRAME_URL,
  logo: 'https://www.ambire.com/ambire-logo.png',
  desc: 'Ambire OpenSea Plugin'
}

const OpenSea = ({ network, selectedAcc, gnosisConnect, gnosisDisconnect }) => {
  return (
    <div id="opensea">
      <GnosisSafeAppIframe
        network={network}
        selectedAcc={selectedAcc}
        gnosisConnect={gnosisConnect}
        gnosisDisconnect={gnosisDisconnect}
        selectedApp={ambireOpenSea}
        title="Ambire OpenSea"
      />
    </div>
  )
}

export default OpenSea
