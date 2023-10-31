import useGasTankData from 'ambire-common/src/hooks/useGasTankData'

import { useRelayerData } from 'hooks'

import { Panel } from 'components/common'
import History from './History/History'
import TopUp from './TopUp/TopUp'

const RightPanel = ({ network, relayerURL, portfolio, account, panelClassName }) => {
  const { gasTankFilledTxns, feeAssetsRes, availableFeeAssets } = useGasTankData({
    relayerURL,
    selectedAcc: account,
    network,
    portfolio,
    useRelayerData
  })

  // NOTE<Bobby>: filter all gas tank top up transaction with
  // a value of 0. ERC-20 token top ups also have value here
  // so it is safe. We do this to filter out txns to the feeCollector
  // that are not actually top ups
  const filtered = gasTankFilledTxns
    ? gasTankFilledTxns.filter(txn => txn.value.toString() != 0)
    : null

  return (
    <Panel className={panelClassName}>
      <TopUp portfolio={portfolio} network={network} availableFeeAssets={availableFeeAssets} />
      <History
        network={network}
        gasTankFilledTxns={filtered}
        feeAssetsRes={feeAssetsRes}
      />
    </Panel>
  )
}

export default RightPanel
