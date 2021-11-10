import './Trading.scss';

import React from 'react';
import Swap from './SushiIframe'

export default function Trading(props) {

    console.log('props', props)

    return (
        <section id="trading">     
            <Swap {...props} />  
        </section>
    )
}