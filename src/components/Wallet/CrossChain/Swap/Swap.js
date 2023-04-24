import { Panel } from 'components/common'
import SwapInner from './SwapInner/SwapInner'

const Swap = ({
  network,
  portfolio,
  addRequest,
  selectedAccount,
  quotesConfirmed,
  setQuotesConfirmed,
  panelClassName
}) => (
  <Panel className={panelClassName} title="Cross-Chain transfers/swaps">
    <SwapInner
      network={network}
      portfolio={portfolio}
      addRequest={addRequest}
      selectedAccount={selectedAccount}
      quotesConfirmed={quotesConfirmed}
      setQuotesConfirmed={setQuotesConfirmed}
    />
  </Panel>
)

export default Swap
