import './SushiFrame.scss';

import React from 'react'

const  SUSHI_SWAP_IFRAME_URL  = 'http://localhost:3005/swap'

export default function SushiSwap(props) {

    return (
            <iframe id='swap-frame' title='sushi-swap' src={SUSHI_SWAP_IFRAME_URL} />
    )

}