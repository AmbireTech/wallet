import './SushiFrame.scss';

import React, { useEffect, useRef, useState } from 'react'

import { SUSHI_SWAP_FRAME } from '../../../config'
import { InfiniteProgressBar } from '../../common'

const ambireSushi = {
    name: "Ambire swap",
    url: SUSHI_SWAP_FRAME,
    logo: 'https://www.ambire.com/ambire-logo.png',
    desc: 'Ambire swap'
}

export default function SushiSwap({ network, selectedAcc, gnosisConnect, gnosisDisconnect }) {
    const { chainId } = network || []
    const [loading, setLoading] = useState(true)
    const [hash, setHash] = useState('')
    const iframeRef = useRef(null);


    useEffect(() => {
        const newHash = ambireSushi.url + chainId + selectedAcc
        setHash(newHash)
    }, [chainId, selectedAcc])

    useEffect(() => {
        setLoading(true)
    }, [hash])

    useEffect(() => {
        gnosisConnect({
            selectedAcc,
            iframeRef,
            app: ambireSushi
        });

        return () => {
            gnosisDisconnect()
        }

    }, [network, selectedAcc, iframeRef, gnosisConnect, gnosisDisconnect])

    return (
        <div className='iframe-container'>
            {loading && <InfiniteProgressBar />}
            <iframe
                id='swap-frame'
                key={hash}
                ref={iframeRef}
                title='sushi-swap'
                src={SUSHI_SWAP_FRAME}

                onLoad={() => setLoading(false)}
            />
        </div>
    )
}