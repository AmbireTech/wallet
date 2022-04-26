import { ALLOWANCES_FRAME } from 'config'
import GnosisSafeAppIframe from 'components/Plugins/GnosisSafeApps/GnosisSafeAppIframe'

const ambireAllowances = {
    name: "Ambire allowances",
    url: ALLOWANCES_FRAME,
    logo: ALLOWANCES_FRAME + '/logo.png',
    desc: 'Ambire allowances checker'
}

export default function AllowancesIframe({ network, selectedAcc, gnosisConnect, gnosisDisconnect }) {

    return (
        <GnosisSafeAppIframe
            network={network}
            selectedAcc={selectedAcc}
            gnosisConnect={gnosisConnect}
            gnosisDisconnect={gnosisDisconnect}
            selectedApp={ambireAllowances}
            title={'Ambire allowances'}
        />
    )
}
