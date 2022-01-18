import './GnosisSafeApps.scss'

import { useEffect, useRef, useState } from 'react'
import {
    Skeleton,
    AmbireLoading
} from 'components/common'

export default function GnosisSafeAppIframe({
    selectedApp = {},
    title = 'Ambire Plugin',
    network,
    selectedAcc,
    gnosisConnect,
    gnosisDisconnect
}) {

    const { chainId } = network || {}
    const { url } = selectedApp || {}
    const [loading, setLoading] = useState(true)
    const [hash, setHash] = useState('')
    const iframeRef = useRef(null);


    useEffect(() => {
        const newHash = url + chainId + selectedAcc
        setHash(newHash)
    }, [chainId, selectedAcc, url])

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
        <div id="plugin-gnosis-container">
            {
                loading &&
                <div className='iframe-placeholder'>
                    <Skeleton >
                        <AmbireLoading />
                    </Skeleton>
                </div>
            }

            {
                url &&
                <iframe
                    id={hash}
                    key={hash}
                    ref={iframeRef}
                    title={title}
                    src={url}
                    onLoad={() => setLoading(false)}
                    style={loading ? { display: 'none' } : {}}
                />
            }
        </div>)
}
