import { SUSHI_SWAP_FRAME, SUSHI_SWAP_FRAME_EXCEPTIONS } from 'config'
import GnosisSafeAppIframe from 'components/Plugins/GnosisSafeApps/GnosisSafeAppIframe'

const ambireSushi = {
  name: 'Ambire swap',
  url: SUSHI_SWAP_FRAME,
  logo: 'https://www.ambire.com/ambire-logo.png',
  desc: 'Ambire swap'
}

export default function SushiSwap({ network, selectedAcc, gnosisConnect, gnosisDisconnect }) {
  const ambireSushiCurrent = ambireSushi
  if (SUSHI_SWAP_FRAME_EXCEPTIONS[network.id])
    ambireSushiCurrent.url = SUSHI_SWAP_FRAME_EXCEPTIONS[network.id]
  else ambireSushiCurrent.url = SUSHI_SWAP_FRAME
  return (
    <GnosisSafeAppIframe
      network={network}
      selectedAcc={selectedAcc}
      gnosisConnect={gnosisConnect}
      gnosisDisconnect={gnosisDisconnect}
      selectedApp={ambireSushiCurrent}
      title="Ambire swap"
    />
  )
}
