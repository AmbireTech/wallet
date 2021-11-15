import './SushiFrame.scss';

import React, { useEffect, useRef } from 'react'

import { SUSHI_SWAP_FRAME } from '../../../config'

const ambireSushi = {
    name: "Ambire swap",
    url: SUSHI_SWAP_FRAME,
    logo: 'https://www.ambire.com/ambire-logo.png',
    desc: 'Ambire swap'
}

export default function SushiSwap({ network, selectedAcc, gnosisConnect, gnosisDisconnect }) {
    const iframeRef = useRef(null);


    useEffect(() => {
        gnosisConnect({
            selectedAcc: selectedAcc,
            iframeRef: iframeRef,
            app: ambireSushi
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [network, selectedAcc, iframeRef])



    return (
        <div className='iframe-container'>
            <iframe id='swap-frame' ref={iframeRef} title='sushi-swap' src={SUSHI_SWAP_FRAME} />
        </div>
    )
}