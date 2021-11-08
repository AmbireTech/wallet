import './Trading.scss';

import React from 'react';
import Swap from './SushiIframe'

export default function Dashboard({ portfolio }) {

    return (
        <section id="trading">     
            <Swap />  
        </section>
    )
}