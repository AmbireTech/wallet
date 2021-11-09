import './SushiFrame.scss';

import React from 'react'

import { SUSHI_SWAP_FRAME } from '../../../config'

export default function SushiSwap(props) {
    return (
        <iframe id='swap-frame' title='sushi-swap' src={SUSHI_SWAP_FRAME} />
    )
}