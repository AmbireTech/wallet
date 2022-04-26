import './Allowances.scss';

import React from 'react';
import AllowancesComponent from './AllowancesIframe'

export default function Allowances(props) {
    return (
        <section id="allowances">
            <AllowancesComponent {...props} />
        </section>
    )
}
