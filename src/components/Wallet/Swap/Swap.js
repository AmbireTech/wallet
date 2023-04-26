import './Swap.scss'

import React from 'react'
import SwapComponent from './SushiIframe'
import OfflineWrapper from 'components/OfflineWrapper/OfflineWrapper'

export default function Swap(props) {
  return (
    <section id="swap">
      <OfflineWrapper>
        <SwapComponent {...props} />
      </OfflineWrapper>
    </section>
  )
}
