import useGasTankData from 'ambire-common/src/hooks/useGasTankData'

import { useRelayerData } from 'hooks'

import History from './History/History'
import TopUp from './TopUp/TopUp'

import styles from './RightPanel.module.scss'

const RightPanel = ({ network, relayerURL, portfolio, account, userSorting, setUserSorting }) => {
  const { gasTankFilledTxns, feeAssetsRes, availableFeeAssets } = useGasTankData({
    relayerURL,
    selectedAcc: account,
    network,
    portfolio,
    useRelayerData,
  })

  return (
    <div className={styles.wrapper}>
      <TopUp
        portfolio={portfolio}
        userSorting={userSorting}
        account={account}
        network={network}
        setUserSorting={setUserSorting}
        availableFeeAssets={availableFeeAssets}
      />
      <History network={network} gasTankFilledTxns={gasTankFilledTxns} feeAssetsRes={feeAssetsRes} />
    </div>
  )
}

export default RightPanel
