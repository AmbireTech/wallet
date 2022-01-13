import { SUSHI_SWAP_FRAME } from 'config'
import GnosisSafeAppIframe from 'components/Plugins/GnosisSafeApps/GnosisSafeAppIframe'

const ambireSushi = {
    name: "Ambire swap",
    url: SUSHI_SWAP_FRAME,
    logo: 'https://www.ambire.com/ambire-logo.png',
    desc: 'Ambire swap'
}

export default function SushiSwap({ network, selectedAcc, gnosisConnect, gnosisDisconnect }) {
    return (
        <GnosisSafeAppIframe
            network={network}
            selectedAcc={selectedAcc}
            gnosisConnect={gnosisConnect}
            gnosisDisconnect={gnosisDisconnect}
            selectedApp={ambireSushi}
            title={'Ambire swap'}
        />
    )
}