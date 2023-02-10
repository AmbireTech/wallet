import cn from 'classnames'
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
    <div className={styles.wrapper}>
      <div className={styles.allNetworksAndToggle}>
        <div className={styles.box} onClick={openGasTankBalanceByTokensModal} style={{ cursor: 'pointer' }}>
          <span className={styles.balanceAllNetworks}>
            <GiGasPump /> Balance on All Networks
          </span>
          {!isLoading ? (
            <h3 className={cn(styles.bigText, { [styles.small]: gasTankBalancesFormatted.length > 6 })}>
              <span>$</span>{gasTankBalancesFormatted}
            </h3>
          ) : (
            <Loading />
          )}
          {/* TODO: Add functionality for drag and drop */}
          {/* <span>Drag and drop tokens here</span> */}
          <p className={styles.footer}>Click for more</p>
        </div>

        <div className={styles.toggleWrapper}>
          <Toggle checked={currentAccGasTankState.isEnabled} onChange={() => toggleGasTank()} />
          <span className={styles.toggleLabel}>{currentAccGasTankState.isEnabled ? 'Enabled' : 'Disabled'}</span>
        </div>
      </div>
      <div className={cn(styles.box, styles.totalSave)}>
        <div className={styles.smallText}>
          <h5 className={cn(styles.label, styles.green)}>Total Saved: </h5>
          <p className={styles.amount}>
            <span>$</span>{totalSaved ? totalSaved : '0.00'}
          </p>
        </div>
        <div className={styles.smallText}>
          <h5 className={styles.label}>Total Cashback: </h5>
          <p className={styles.amount}>
            <span>$</span>{totalCashBack ? totalCashBack : '0.00'}
          </p>
        </div>
        <p className={styles.footer}>From gas fees on {network.name}</p>
      </div>
    </div>
  )
}

export default Heading
