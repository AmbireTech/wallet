import './GnosisSafeApps.scss'

import { useEffect, useRef, useState } from 'react'
import { InfiniteProgressBar } from '../../common'

export default function GnosisSafeAppIframe({
    selectedApp,
    title = 'Ambire Plugin',
    network,
    selectedAcc,
    gnosisConnect,
    gnosisDisconnect
}) {

    const { chainId } = network || []
    const [loading, setLoading] = useState(true)
    const [hash, setHash] = useState('')
    const iframeRef = useRef(null);


    useEffect(() => {
        const newHash = selectedAcc.url + chainId + selectedAcc
        setHash(newHash)
    }, [chainId, selectedAcc])

    useEffect(() => {
        setLoading(true)
    }, [hash])

    useEffect(() => {
        gnosisConnect({
            selectedAcc,
            iframeRef,
            app: selectedApp
        });

        return () => {
            gnosisDisconnect()
        }

    }, [selectedApp, network, selectedAcc, iframeRef, gnosisConnect, gnosisDisconnect])

    return (
        <div id="plugin-gnosis-conainer">
            {loading && <InfiniteProgressBar />}

            {selectedApp && <iframe
                id={hash}
                key={hash}
                ref={iframeRef}
                title={title}
                src={selectedApp.url}
                onLoad={() => setLoading(false)}
            />}
        </div>)
}
