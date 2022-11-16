import useGasTankData from 'ambire-common/src/hooks/useGasTankData'

import { formatFloatTokenAmount } from 'lib/formatters'

import { useModals, useRelayerData } from 'hooks'
import { useToasts } from 'hooks/toasts'
import GasTankBalanceByTokensModal from 'components/Modals/GasTankBalanceByTokensModal/GasTankBalanceByTokensModal'
import { Loading, Toggle } from 'components/common'

import { GiGasPump } from 'react-icons/gi'

import styles from './Heading.module.scss'

const Heading = ({ network, relayerURL, portfolio, account, gasTankState, setGasTankState }) => {
  const { isLoading, balancesRes, gasTankBalances, totalSavedResult } = useGasTankData({
    relayerURL,
    selectedAcc: account,
    network,
    portfolio,
    useRelayerData,
  })
  const { showModal } = useModals()
  const { addToast } = useToasts()

  const gasTankBalancesFormatted = gasTankBalances ? formatFloatTokenAmount(gasTankBalances, true, 2) : '0.00'
  const totalSaved =
    totalSavedResult &&
    totalSavedResult.length &&
    formatFloatTokenAmount(
      totalSavedResult.map((i) => i.saved).reduce((a, b) => a + b),
      true,
      2
    )
  const totalCashBack =
    totalSavedResult &&
    totalSavedResult.length &&
    formatFloatTokenAmount(
      totalSavedResult.map((i) => i.cashback).reduce((a, b) => a + b),
      true,
      2
    )

  const currentAccGasTankState = gasTankState.length
    ? gasTankState.find((i) => i.account === account)
    : setGasTankState([...gasTankState, { account: account, isEnabled: false }])
  const toggleGasTank = () => {
    if (!gasTankBalances && !gasTankBalances.length) {
      addToast('Add assets from the list to the Gas Tank to enable it.', { error: true })
      return
    }

    const updatedGasTankDetails = gasTankState.map((item) =>
      item.account === account ? { ...item, isEnabled: !item.isEnabled } : item
    )
    setGasTankState(updatedGasTankDetails)
  }

  const openGasTankBalanceByTokensModal = () => {
    showModal(<GasTankBalanceByTokensModal data={balancesRes && balancesRes.length ? balancesRes : []} />)
  }

  return (
    <div className={styles.heading}>
      <div className={styles.balance} style={{ cursor: 'pointer' }} onClick={openGasTankBalanceByTokensModal}>
        <span>
          <GiGasPump /> Balance on All Networks
        </span>
        {!isLoading && gasTankBalances ? (
          <div className={gasTankBalancesFormatted.length > 6 ? 'inner-wrapper-left small-font' : 'inner-wrapper-left'}>
            <span>$</span> {gasTankBalancesFormatted}
          </div>
        ) : (
          <Loading />
        )}
        {/* TODO: Add functionality for drag and drop */}
        {/* <span>Drag and drop tokens here</span> */}
        <span>Click for more</span>
      </div>
      <div className={styles.toggleWrapper}>
        <Toggle checked={currentAccGasTankState.isEnabled} onChange={() => toggleGasTank()} />
        {currentAccGasTankState.isEnabled ? <span>Enabled</span> : <span>Disabled</span>}
      </div>

      <div className="balance-wrapper total-save">
        <div className="inner-wrapper-right">
          <div className="label green">Total Saved: </div>
          <div className="amount">
            <span>$</span> {totalSaved ? totalSaved : '0.00'}
          </div>
        </div>
        <div className="inner-wrapper-right">
          <div className="label">Total Cashback: </div>
          <div className="amount">
            <span>$</span> {totalCashBack ? totalCashBack : '0.00'}
          </div>
        </div>
        <span>From transaction fees on {network.id.toUpperCase()}</span>
      </div>
    </div>
  )
}

export default Heading
