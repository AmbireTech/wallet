import useGasTankData from 'ambire-common/src/hooks/useGasTankData'

import { useRelayerData } from 'hooks'

import History from './History/History'
import TopUp from './TopUp/TopUp'

import { Panel } from 'components/common'

const RightPanel = ({ network, relayerURL, portfolio, account,  panelClassName }) => {
  const { gasTankFilledTxns, feeAssetsRes, availableFeeAssets } = useGasTankData({
    relayerURL,
    selectedAcc: account,
    network,
    portfolio,
    useRelayerData,
  })

  return (
    <Panel className={panelClassName}>
      <TopUp
        portfolio={portfolio}
        network={network}
        availableFeeAssets={availableFeeAssets}
      />
      <History network={network} gasTankFilledTxns={gasTankFilledTxns} feeAssetsRes={feeAssetsRes} />
    </Panel>
  )
}

export default RightPanel
