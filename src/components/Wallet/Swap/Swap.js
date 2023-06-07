import './Swap.scss'

import SwapComponent from './SushiIframe'

export default function Swap(props) {
  return (
    <section id="swap">
      <SwapComponent {...props} />
    </section>
  )
}
